import {
  createReward,
  deleteReward,
  listRewards,
  updateReward,
} from '$lib/server/rewards';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.token;
  if (!token) {
    return {
      rewards: [],
      error: 'Authentication required to view rewards.'
    };
  }

  const response = await listRewards(token);
  console.log('Rewards response:', response);
  
  if (response.status === 'error') {
    console.error('Error fetching rewards:', response.message);
    return {
      rewards: [],
      error: response.message
    };
  }

  return {
    rewards: response.data || []
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const token = locals.token;
    if (!token) {
      // Use fail for authentication errors in actions
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const pointsRequiredStr = formData.get('pointsRequired')?.toString();
    const category = formData.get('category')?.toString();
    const available = formData.get('available') === 'true';

    // --- Input Validation ---
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Name is required';
    if (!description) errors.description = 'Description is required';
    if (!pointsRequiredStr) errors.pointsRequired = 'Points cost is required';
    if (!category) errors.category = 'Category is required';

    const pointsRequired = Number(pointsRequiredStr);
    if (isNaN(pointsRequired) || pointsRequired < 0) {
      errors.pointsRequired = 'Points cost must be a valid non-negative number';
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        errors,
        name,
        description,
        pointsRequired: pointsRequiredStr, 
        category,
        available
      });
    }
    // --- End Input Validation ---

    const payload = {
      name,
      description,
      pointsRequired,
      category,
      available,
    };
    
    const response = await createReward(payload, token);

    if (response.status === 'error') {
      console.error('Error creating reward:', response.message);
      return fail(400, {
        error: response.message,
        name, 
        description, 
        pointsRequired: pointsRequiredStr, 
        category, 
        available // Repopulate form
      });
    }

    return {
      success: true,
      data: response.data
    };
  },

  update: async ({ request, locals }) => {
    const token = locals.token;
    if (!token) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString(); // Ensure you have the ID in your form
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const pointsRequiredStr = formData.get('pointsRequired')?.toString();
    const category = formData.get('category')?.toString();
    const available = formData.get('available') === 'true';

    // --- Input Validation ---
    const errors: Record<string, string> = {};
    if (!id) errors.id = 'Reward ID is missing'; // Critical error
    if (!name) errors.name = 'Name is required';
    if (!description) errors.description = 'Description is required';
    if (!pointsRequiredStr) errors.pointsRequired = 'Points cost is required';
    if (!category) errors.category = 'Category is required';

    const pointsRequired = Number(pointsRequiredStr);
    if (isNaN(pointsRequired) || pointsRequired < 0) {
      errors.pointsRequired = 'Points cost must be a valid non-negative number';
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        errors, id, name, description, pointsRequired: pointsRequiredStr, category, available
      });
    }

    const payload = { name, description, pointsRequired, category, available };
    console.log('Update payload:', payload);
    const response = await updateReward(id!, payload, token);
    
    if (response.status === 'error') {
      console.error('Error updating reward:', response.message);
      return fail(400, {
        error: response.message,
        id, name, description, pointsRequired: pointsRequiredStr, category, available
      });
    }

    return {
      success: true,
      data: response.data 
    };
  },

  delete: async ({ request, locals }) => {
    const token = locals.token;
    if (!token) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const rewardId = formData.get('rewardId')?.toString();

    if (!rewardId) {
      return fail(400, { error: 'Reward ID is required', rewardId });
    }

    const response = await deleteReward(rewardId, token);
    console.log('Delete reward response:', response);
    
    if (response.status === 'error') {
      console.error('Error deleting reward:', response.message);
      return fail(400, {
        error: response.message,
        rewardId
      });
    }

    return {
      success: true,
      deletedRewardId: rewardId 
    };
  },
} satisfies Actions;
