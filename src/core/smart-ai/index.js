/**
 * SmartAI Pipeline - Main Export Index
 * @module core/smart-ai
 */

// Types
export {
  FileType,
  JobStatus,
  PipelineType,
  DEFAULT_PIPELINE_CONFIG,
  CHUNKING_CONFIG
} from './types.js';

// Core Components
export {
  TypeDetector,
  getTypeDetector
} from './type-detector.js';

export {
  JobManager,
  getJobManager
} from './job-manager.js';

export {
  CacheManager,
  getCacheManager
} from './cache-manager.js';

export {
  SmartAIOrchestrator,
  getSmartAIOrchestrator
} from './orchestrator.js';

// Engine Interfaces
export {
  IEngine,
  IDocumentEngine,
  IImageEngine,
  ICADEngine,
  IRAGEngine,
  IWebEngine,
  IOutputEngine
} from './engine-interface.js';

// Default orchestrator instance untuk convenience
import { getSmartAIOrchestrator } from './orchestrator.js';
export const smartAI = getSmartAIOrchestrator();
