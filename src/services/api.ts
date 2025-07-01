const API_BASE_URL = '/api';

export class ApiService {
  private static userId = '1'; // Simple user ID for now

  static async getUserData() {
    try {
      console.log('Fetching user data...');
      const response = await fetch(`${API_BASE_URL}/data/${this.userId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user data`);
      }
      const data = await response.json();
      console.log('User data loaded successfully');
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  static async saveUserData(data: any) {
    try {
      console.log('Saving user data...');
      const response = await fetch(`${API_BASE_URL}/data/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to save user data`);
      }
      
      const result = await response.json();
      console.log('User data saved successfully');
      return result;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('Server health check:', health);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}