const API_BASE_URL = 'http://localhost:3001/api';

export class ApiService {
  private static userId = 'user1'; // Simple user ID for now

  static async getUserData() {
    try {
      const response = await fetch(`${API_BASE_URL}/data/${this.userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  static async saveUserData(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save user data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}