import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/calculator';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const calculatorAPI = {
  //双操作数运算
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
        throw new Error(error.response.data.message || 'calculate failed');
      } else if (error.request) {
        throw new Error('cannot connect to server, please confirm that the backend service has been started');
      } else {
        throw new Error('request failed: ' + error.message);
      }
    }
  },
  
  //单操作数运算
  async calculateSingle(operand, operation) {
    try {
      const response = await apiClient.post('/calculate-single', {
        operand: operand,
        operation: operation
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'calculate failed');
      } else if (error.request) {
        throw new Error('cannot connect to server, please confirm that the backend service has been started');
      } else {
        throw new Error('request failed: ' + error.message);
      }
    }
  }
};
