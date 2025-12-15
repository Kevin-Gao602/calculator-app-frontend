import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api/calculator'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });//创建axios实例，配置基础URL

export const calculatorAPI = {
    async calculate(operand1, operand2, operation) {
        try {
          const response = await apiClient.post('/calculate', {
            operand1: operand1,
            operand2: operand2,
            operation: operation
          });
          return response.data;
        } catch (error) {
          if (error.response) {
            throw new Error(error.response.data.message || 'Calculation failed');
          } else if (error.request) {
            throw new Error('Cannot connect to server');
          } else {
            throw new Error('Request failed: ' + error.message);
          }
        }
      }
}
