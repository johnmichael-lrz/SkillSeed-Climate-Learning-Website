import { supabase } from '../lib/supabaseClient.js';

/**
 * Fetches matching profiles for a project using the get_project_matches RPC.
 * Returns verified users whose skills overlap with the project's skills_needed,
 * ordered by match score (number of overlapping skills).
 *
 * @param {string} projectId - UUID of the project
 * @returns {Promise<Array>} Array of matched profiles with match_score
 */
export async function fetchMatchesForProject(projectId) {
  try {
    const { data, error } = await supabase.rpc('get_project_matches', {
      p_project_id: projectId,
    });

    if (error) {
      console.error('Error fetching project matches:', error);
      throw error;
    }

    return data ?? [];
  } catch (err) {
    console.error('fetchMatchesForProject failed:', err);
    throw err;
  }
}

import { supabase } from '../lib/supabaseClient';

export async function applyToProject(projectId, userId, message, role) {
  // 1. Check if the message is empty BEFORE sending to the database
  if (!message || message.trim().length < 5) {
    return { success: false, error: "Please enter a message (at least 5 characters) before applying." };
  }

  try {
    // 2. Try to insert the application into Supabase
    const { data, error } = await supabase
      .from('connections')
      .insert([{ 
        project_id: projectId, 
        responder_id: userId, 
        message: message.trim(),
        role: role,
        status: 'pending' 
      }]);

    // 3. Catch database errors (like if they already applied)
    if (error) {
      console.error("Supabase Error:", error);
      return { success: false, error: "Failed to submit application. Please try again." };
    }

    return { success: true, data: data };

  } catch (err) {
    return { success: false, error: "An unexpected error occurred." };
  }
}