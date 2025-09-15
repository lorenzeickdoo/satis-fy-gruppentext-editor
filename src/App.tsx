import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, User, Sparkles, Settings } from 'lucide-react';
import { fetchGroupTextData, updateGroupText } from './services/api';
import { generateTextWithOpenAI } from './services/openai';
import { saveAITextEvaluation } from './services/supabase';
import { TextGroup, AISettings, ApiResponse } from './types/api';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/auth/UserProfile';

function App() {
  const [textGroups, setTextGroups] = useState<TextGroup[]>([]);
  const [originalTextGroups, setOriginalTextGroups] = useState<TextGroup[]>([]);
  const [jobData, setJobData] = useState<{
    jobName: string;
    jobNumber: string;
    jobId: string;
  }>({
    jobName: '',
    jobNumber: '',
    jobId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchJobNumber, setSearchJobNumber] = useState('23-2160.10');

  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [postBody, setPostBody] = useState<any>(null);
  const [simplifiedJson, setSimplifiedJson] = useState<any>(null);

  const [aiSettings, setAISettings] = useState<AISettings>({
    length: 'Kurz',
    language: 'English',
    tone: 'professional',
    style: 'structured'
  });

  const [activeTextArea, setActiveTextArea] = useState<string>('');
  const [selectedAIGroup, setSelectedAIGroup] = useState<string>('');
  const [showAITool, setShowAITool] = useState<boolean>(false);
  const [hoveredGroup, setHoveredGroup] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Bulk generation state
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkResults, setBulkResults] = useState<Array<{
    groupId: string;
    groupName: string;
    originalText: string;
    generatedText: string;
    status: 'pending' | 'generating' | 'completed' | 'error';
    error?: string;
  }>>([]);
  const [bulkGenerationAborted, setBulkGenerationAborted] = useState<boolean>(false);

  // Track if search was performed to disable button
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Update status tracking
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  
  // Track generation start time for evaluation data
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(null);

  // Check if any group content has been modified
  const hasChanges = textGroups.some((group, index) => {
    const originalGroup = originalTextGroups[index];
    return originalGroup && group.content !== originalGroup.content;
  });

  const openAIToolForGroup = (groupId: string) => {
    setShowAITool(true);
    setSelectedAIGroup(groupId);
  };

  const loadData = async (jobNumber: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchGroupTextData(jobNumber);
      console.log('Loading data for job number:', jobNumber);
      
      // Store the complete API response
      setApiResponse(response);
      
      // Initialize POST body with simplified structure
      const initialPostBody = {
        groups: response.data.groups.map(group => ({
          name: group.group.name,
          client_text: group.group.client_text
        }))
      };
      
      // Set job data
      setJobData({
        jobName: response.data.job_name,
        jobNumber: response.data.job_number,
        jobId: response.data.job_id
      });

      // Transform API groups to TextGroup format
      const transformedGroups: TextGroup[] = response.data.groups.map((group) => ({
        id: group.group.id.toString(),
        name: group.group.name,
        expanded: true, // Start with first few expanded
        articlesExpanded: false,
        content: group.group.client_text,
        originalId: group.group.id,
        sortOrder: group.group.sort_order,
        articles: group.article
      }));

      // Sort by sort_order
      transformedGroups.sort((a, b) => a.sortOrder - b.sortOrder);

      setTextGroups(transformedGroups);
      // Store original content for change tracking
      setOriginalTextGroups(JSON.parse(JSON.stringify(transformedGroups)));
    } catch (err) {
      console.error('Error in loadData:', err);
      setError('Failed to load data from API');
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  };

  const handleSearch = () => {
    if (searchJobNumber.trim()) {
      loadData(searchJobNumber.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleGroup = (groupId: string) => {
    setTextGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, expanded: !group.expanded }
        : group
    ));
  };

  const toggleArticles = (groupId: string) => {
    setTextGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, articlesExpanded: !group.articlesExpanded }
        : group
    ));
  };

  const updateGroupContent = (groupId: string, content: string) => {
    setTextGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, content }
        : group
    ));
  };

  const generateText = () => {
    const sampleTexts = [
      'Dieser professionell generierte Text wurde basierend auf Ihren Einstellungen erstellt. Er folgt einem strukturierten Ansatz und berücksichtigt den gewählten Ton.',
      'Ein weiterer Beispieltext, der die KI-Funktionalität demonstriert. Dieser Text ist auf Professionalität ausgerichtet und bietet hochwertige Inhalte.',
      'Automatisch generierter Inhalt mit fokussierter Struktur. Dieser Text zeigt die Vielseitigkeit der KI-Textgenerierung in verschiedenen Kontexten.'
    ];
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    
    if (activeTextArea) {
      updateGroupContent(activeTextArea, randomText);
    }
  };

  const handleUpdate = async () => {
    if (!apiResponse) return;

    setIsUpdating(true);
    setUpdateStatus('');
    
    try {
      // Find all groups that have been modified
      const changedGroups = textGroups.filter((group, index) => {
        const originalGroup = originalTextGroups[index];
        return originalGroup && group.content !== originalGroup.content;
      });
      
      console.log(`Updating ${changedGroups.length} changed groups...`);
      
      // Update each changed group sequentially
      let successCount = 0;
      let errorCount = 0;
      
      for (const group of changedGroups) {
        try {
          console.log(`Updating group ${group.name} (ID: ${group.originalId})...`);
          await updateGroupText(group.originalId, group.content);
          successCount++;
          console.log(`✅ Successfully updated: ${group.name}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to update ${group.name}:`, error);
        }
      }
      
      // Update status message
      if (errorCount === 0) {
        setUpdateStatus(`✅ Erfolgreich: ${successCount} Gruppe(n) aktualisiert`);
        // Update originalTextGroups to reflect the current state
        setOriginalTextGroups(JSON.parse(JSON.stringify(textGroups)));
      } else {
        setUpdateStatus(`⚠️ ${successCount} erfolgreich, ${errorCount} Fehler`);
      }
      
    } catch (error) {
      console.error('Update error:', error);
      setUpdateStatus('❌ Fehler beim Aktualisieren');
    } finally {
      setIsUpdating(false);
      // Clear status after 3 seconds
      setTimeout(() => setUpdateStatus(''), 3000);
    }
  };


  const handleGenerate = async () => {
    if (!selectedAIGroup) {
      alert('Bitte wählen Sie zuerst eine Gruppe aus.');
      return;
    }

    // Handle bulk generation for all groups
    if (selectedAIGroup === 'ALL_GROUPS') {
      await handleBulkGenerate();
      return;
    }

    // Handle single group generation
    const selectedGroup = textGroups.find(g => g.id === selectedAIGroup);
    if (!selectedGroup) {
      alert('Ausgewählte Gruppe nicht gefunden.');
      return;
    }

    setIsGenerating(true);
    setGenerationStartTime(new Date());
    try {
      const generatedText = await generateTextWithOpenAI({
        groupName: selectedGroup.name,
        groupContent: selectedGroup.content,
        articles: selectedGroup.articles.map(item => ({
          name: item.article.name,
          category: item.article.category,
          count: item.article.count
        })),
        settings: aiSettings,
        customPrompt: customPrompt.trim() || undefined
      });

      // Store generated text for comparison
      setGeneratedText(generatedText);
      setShowComparison(true);
    } catch (error) {
      console.error('Error generating text:', error);
      alert(`Fehler beim Generieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleBulkGenerate = async () => {
    setIsBulkMode(true);
    setBulkGenerationAborted(false);
    
    // Initialize bulk results
    const initialResults = textGroups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      originalText: group.content,
      generatedText: '',
      status: 'pending' as const
    }));
    
    setBulkResults(initialResults);
    
    // Generate texts sequentially
    for (let i = 0; i < textGroups.length; i++) {
      if (bulkGenerationAborted) break;
      
      const group = textGroups[i];
      
      // Update status to generating
      setBulkResults(prev => prev.map((result, index) => 
        index === i ? { ...result, status: 'generating' } : result
      ));
      
      try {
        const generatedText = await generateTextWithOpenAI({
          groupName: group.name,
          groupContent: group.content,
          articles: group.articles.map(item => ({
            name: item.article.name,
            category: item.article.category,
            count: item.article.count
          })),
          settings: aiSettings,
          customPrompt: customPrompt.trim() || undefined
        });
        
        // Update status to completed and store result
        setBulkResults(prev => prev.map((result, index) => 
          index === i ? { 
            ...result, 
            status: 'completed', 
            generatedText 
          } : result
        ));
        
      } catch (error) {
        console.error(`Error generating text for ${group.name}:`, error);
        setBulkResults(prev => prev.map((result, index) => 
          index === i ? { 
            ...result, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          } : result
        ));
      }
    }
  };
  
  const handleApplyBulkChanges = () => {
    bulkResults.forEach(result => {
      if (result.status === 'completed' && result.generatedText) {
        updateGroupContent(result.groupId, result.generatedText);
      }
    });
    
    // Reset bulk mode
    setIsBulkMode(false);
    setBulkResults([]);
    setSelectedAIGroup('');
  };
  
  const handleDiscardBulkChanges = () => {
    setIsBulkMode(false);
    setBulkResults([]);
    setSelectedAIGroup('');
  };
  
  const handleAbortBulkGeneration = () => {
    setBulkGenerationAborted(true);
  };
  
  const handleApplyChanges = async () => {
    if (selectedAIGroup && generatedText) {
      try {
        // Save evaluation data to Supabase (is_accepted = true)
        await saveEvaluationData(true);
        
        // Apply the generated text
        updateGroupContent(selectedAIGroup, generatedText);
        setShowComparison(false);
        setGeneratedText('');
      } catch (error) {
        console.error('Error saving evaluation data:', error);
        // Still apply the text even if saving fails
        updateGroupContent(selectedAIGroup, generatedText);
        setShowComparison(false);
        setGeneratedText('');
      }
    }
  };

  const handleDiscardChanges = async () => {
    if (selectedAIGroup && generatedText) {
      try {
        // Save evaluation data to Supabase (is_accepted = false)
        await saveEvaluationData(false);
      } catch (error) {
        console.error('Error saving evaluation data:', error);
      }
    }
    
    setShowComparison(false);
    setGeneratedText('');
  };

  const saveEvaluationData = async (isAccepted: boolean) => {
    if (!selectedAIGroup || !generatedText || !generationStartTime) return;
    
    const selectedGroup = textGroups.find(g => g.id === selectedAIGroup);
    if (!selectedGroup) return;
    
    // Create articles summary
    const articlesArray = selectedGroup.articles.map(item => ({
      name: item.article.name,
      category: item.article.category,
      count: item.article.count
    }));
    
    const evaluationData = {
      group_name: selectedGroup.name,
      original_text: selectedGroup.content,
      generated_text: generatedText,
      custom_prompt: customPrompt.trim(),
      ai_length: aiSettings.length,
      ai_language: aiSettings.language,
      model_used: 'openai/gpt-4.1-mini',
      articles_json: articlesArray,
      articles_count: articlesArray.length,
      is_accepted: isAccepted,
    };
    
    await saveAITextEvaluation(evaluationData);
  };

  const toggleAITool = () => {
    const newShowAITool = !showAITool;
    setShowAITool(newShowAITool);
    
    // Reset selected group when hiding AI tool
    if (!newShowAITool) {
      setSelectedAIGroup('');
      setShowComparison(false);
      setGeneratedText('');
      setIsBulkMode(false);
      setBulkResults([]);
      setBulkGenerationAborted(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  // Show empty state when no data has been loaded yet
  if (!hasSearched && textGroups.length === 0) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 bg-black text-white flex flex-col flex-shrink-0">
          <div className="px-6 py-8">
            <h1 className="text-xl font-normal tracking-wide">SATIS&FY</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            <div className="py-3 px-4 text-sm text-white bg-gray-900 rounded font-medium">
              Gruppentexte
            </div>
          </nav>
          
          {/* User Profile at bottom of sidebar */}
          <div className="px-4 py-6 border-t border-gray-700">
            <UserProfile />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-6">
                <h2 className="text-2xl font-semibold text-gray-900">Gruppentext Editor</h2>
                <div className="flex items-baseline space-x-2">
                  <label htmlFor="jobNumber" className="text-sm font-medium text-gray-700">
                    Job Nummer:
                  </label>
                  <input
                    id="jobNumber"
                    type="text"
                    value={searchJobNumber}
                    onChange={(e) => {
                      setSearchJobNumber(e.target.value);
                      setHasSearched(false);
                    }}
                    onKeyPress={handleKeyPress}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. 23-2160.10"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  >
                    {loading ? 'Laden...' : 'Suche'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl text-gray-300 mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-900">Willkommen zum Gruppentext Editor</h3>
              <p className="text-gray-600 max-w-md">
                Geben Sie eine Job-Nummer ein und klicken Sie auf "Suche", um mit der Bearbeitung von Gruppentexten zu beginnen.
              </p>
            </div>
          </div>
        </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 bg-black text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-8">
          <h1 className="text-xl font-normal tracking-wide">SATIS&FY</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="py-3 px-4 text-sm text-white bg-gray-900 rounded font-medium">
            Gruppentexte
          </div>
        </nav>
        
        {/* User Profile at bottom of sidebar */}
        <div className="px-4 py-6 border-t border-gray-700">
          <UserProfile />
        </div>
        
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-6">
              <h2 className="text-2xl font-semibold text-gray-900">Gruppentext Editor</h2>
              <div className="flex items-baseline space-x-2">
                <label htmlFor="jobNumber" className="text-sm font-medium text-gray-700">
                  Job Nummer:
                </label>
                <input
                  id="jobNumber"
                  type="text"
                  value={searchJobNumber}
                  onChange={(e) => {
                    setSearchJobNumber(e.target.value);
                    setHasSearched(false); // Re-enable search button when input changes
                  }}
                  onKeyPress={handleKeyPress}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. 23-2160.10"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || hasSearched}
                  className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  {loading ? 'Laden...' : 'Suche'}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-500">
                Job Name: {jobData.jobName}
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleUpdate}
                  disabled={!apiResponse || !hasChanges || isUpdating}
                  className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
                {updateStatus && (
                  <div className="text-xs text-center max-w-32">
                    {updateStatus}
                  </div>
                )}
                <button
                  onClick={toggleAITool}
                  className={`flex items-center justify-center space-x-2 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showAITool 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>AI Tool</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Editor Area */}
          <div className="flex-1 px-8 py-6 overflow-y-auto min-w-0">
            <div className="space-y-6">
              {textGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg border border-gray-200">
                  <div 
                    className="flex items-center p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(group.id)}
                  >
                    {group.expanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                    )}
                    <h3 className="text-base font-medium text-gray-900">
                      {group.name}
                    </h3>
                  </div>
                  
                  {group.expanded && (
                    <div className="px-4 pb-4 space-y-4">
                      <div 
                        className="bg-gray-50 p-4 rounded border relative group/textarea"
                        onMouseEnter={() => setHoveredGroup(group.id)}
                        onMouseLeave={() => setHoveredGroup('')}
                      >
                        {/* KI Button - only show when hovering, AI tool is hidden, and this is the hovered group */}
                        {!showAITool && hoveredGroup === group.id && (
                          <button
                            onClick={() => openAIToolForGroup(group.id)}
                            className="absolute top-2 right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-md flex items-center justify-center transition-all duration-200 z-10"
                            title="KI-Tool für diese Gruppe öffnen"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        <textarea
                          value={group.content}
                          onChange={(e) => updateGroupContent(group.id, e.target.value)}
                          onFocus={() => setActiveTextArea(group.id)}
                          className="w-full bg-transparent border-none resize-none focus:outline-none text-sm text-gray-700 leading-relaxed"
                          rows={4}
                          placeholder="Enter text content..."
                        />
                        {!showAITool && (
                          <button
                            onClick={() => openAIToolForGroup(group.id)}
                            className="absolute top-2 right-2 w-8 h-8 bg-blue-600 text-white text-xs font-bold rounded opacity-0 group-hover/textarea:opacity-100 transition-opacity duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Articles Section */}
                      <div className="border-t pt-4">
                        <div 
                          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => toggleArticles(group.id)}
                        >
                          {group.articlesExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            Artikel ({group.articles.length})
                          </span>
                        </div>
                        
                        {group.articlesExpanded && (
                          <div className="mt-2 space-y-2">
                            {group.articles.map((articleItem, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded text-xs">
                                <div className="text-gray-600 mb-1">
                                  {articleItem.article.category}
                                </div>
                                <div className="text-gray-800 font-medium">
                                  {articleItem.article.count}x {articleItem.article.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Tool Sidebar - Conditionally rendered */}
          {showAITool && (
            <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex items-center space-x-2 mb-6">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Tool</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="groupSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Gruppe auswählen
                    </label>
                    <select
                      id="groupSelect"
                      value={selectedAIGroup}
                      onChange={(e) => setSelectedAIGroup(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Gruppe wählen --</option>
                    <option value="ALL_GROUPS">🚀 Alle Gruppen</option>
                      {textGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900">KI Einstellungen</h4>
                  
                  {/* Length Dropdown */}
                  <div>
                    <label htmlFor="lengthSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Länge
                    </label>
                    <div className="space-y-3">
                      <input
                        id="lengthSlider"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={(() => {
                          // Map string values to slider positions
                          if (aiSettings.length === 'Kurz') return 0;
                          if (aiSettings.length === 'Mittel') return 50;
                          return 100;
                        })()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          
                          // Define snap zones - only snap when close to target positions
                          let newLength = aiSettings.length; // Keep current if no snap
                          
                          if (value <= 15) {
                            newLength = 'Kurz';
                          } else if (value >= 35 && value <= 65) {
                            newLength = 'Mittel';
                          } else if (value >= 85) {
                            newLength = 'Lang';
                          }
                          
                          setAISettings(prev => ({ ...prev, length: newLength }));
                        }}
                        className="slider-modern w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      />
                      
                      {/* Slider Labels */}
                      <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span className={aiSettings.length === 'Kurz' ? 'text-blue-600 font-semibold' : ''}>
                          Kurz
                        </span>
                        <span className={aiSettings.length === 'Mittel' ? 'text-blue-600 font-semibold' : ''}>
                          Mittel
                        </span>
                        <span className={aiSettings.length === 'Lang' ? 'text-blue-600 font-semibold' : ''}>
                          Lang
                        </span>
                      </div>
                      
                      {/* Current Value Display */}
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {aiSettings.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Language Dropdown */}
                  <div>
                    <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Sprache
                    </label>
                    <select
                      id="languageSelect"
                      value={aiSettings.language}
                      onChange={(e) => setAISettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="Deutsch">Deutsch</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                  
                  {/* Custom Prompt Input */}
                  <div>
                    <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Zusätzliche Anforderungen
                    </label>
                    <textarea
                      id="customPrompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      rows={3}
                      placeholder="z.B. Erwähne die Nachhaltigkeit, verwende eine professionelle Tonalität..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Zusätzliche Anweisungen für die KI-Generierung
                    </p>
                  </div>
                </div>
                
                {/* Text Comparison View */}
               {showComparison && selectedAIGroup && !isBulkMode && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-semibold text-gray-900">Textvergleich</h4>
                    
                    <div className="space-y-4">
                      {/* Current Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Aktueller Text
                        </label>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md max-h-32 overflow-y-auto">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {textGroups.find(g => g.id === selectedAIGroup)?.content || ''}
                          </p>
                        </div>
                      </div>
                      
                      {/* Generated Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Generierter Text
                        </label>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md max-h-32 overflow-y-auto">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {generatedText}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleDiscardChanges}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Verwerfen
                      </button>
                      <button
                        onClick={handleApplyChanges}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Bulk Generation Results View */}
                {isBulkMode && (
                 <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">Bulk Generation</h4>
                      {bulkResults.some(r => r.status === 'generating') && (
                        <button
                          onClick={handleAbortBulkGeneration}
                          className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                        >
                          Abbrechen
                        </button>
                      )}
                    </div>
                    
                   <div className="space-y-3">
                      {bulkResults.map((result, index) => (
                       <div key={result.groupId} className="border border-gray-200 rounded-lg p-3">
                         <div className="flex items-center space-x-3 mb-2">
                           <div className="flex-shrink-0 w-4 h-4">
                            {result.status === 'pending' && (
                              <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            )}
                            {result.status === 'generating' && (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {result.status === 'completed' && (
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            {result.status === 'error' && (
                              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✗</span>
                              </div>
                            )}
                           </div>
                           <div className="flex-1 text-sm font-medium text-gray-900">
                            {result.groupName}
                           </div>
                          </div>
                         
                         {/* Show text comparison for completed results */}
                         {result.status === 'completed' && result.generatedText && (
                           <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">
                                 Original
                               </label>
                               <div className="p-2 bg-red-50 border border-red-200 rounded text-xs max-h-24 overflow-y-auto">
                                 <p className="text-gray-800 whitespace-pre-wrap">
                                   {result.originalText}
                                 </p>
                               </div>
                             </div>
                             
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">
                                 Generiert
                               </label>
                               <div className="p-2 bg-green-50 border border-green-200 rounded text-xs max-h-24 overflow-y-auto">
                                 <p className="text-gray-800 whitespace-pre-wrap">
                                   {result.generatedText}
                                 </p>
                               </div>
                             </div>
                           </div>
                         )}
                         
                         {/* Show error message */}
                         {result.status === 'error' && result.error && (
                           <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                             <p className="text-xs text-red-700">{result.error}</p>
                           </div>
                         )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Bulk Action Buttons - only show when generation is complete */}
                    {bulkResults.length > 0 && !bulkResults.some(r => r.status === 'generating') && (
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleDiscardBulkChanges}
                          className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                          Alle verwerfen
                        </button>
                        <button
                          onClick={handleApplyBulkChanges}
                          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                          Alle übernehmen
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
              
              {/* Generate Button - positioned at bottom right, only show when not comparing */}
              {!showComparison && !isBulkMode && (
                <div className="mt-auto p-6 pt-0">
                  <div className="flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={!selectedAIGroup || isGenerating}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                    >
                      {isGenerating && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>
                        {isGenerating ? 'Generiere...' : selectedAIGroup === 'ALL_GROUPS' ? 'Bulk Generate' : 'Generate'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}

export default App;