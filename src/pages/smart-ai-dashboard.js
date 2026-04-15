/**
 * SmartAI Dashboard Page
 * @module pages/smart-ai-dashboard
 */

import { renderSmartAIDashboard, initSmartAIDashboard } from '../components/smart-ai-dashboard.js';

/**
 * Render SmartAI Dashboard Page
 * @returns {Promise<string>}
 */
export async function smartAIDashboardPage() {
  return renderSmartAIDashboard();
}

/**
 * After render handler
 */
export async function afterSmartAIDashboardRender() {
  initSmartAIDashboard();
}

export default { smartAIDashboardPage, afterSmartAIDashboardRender };
