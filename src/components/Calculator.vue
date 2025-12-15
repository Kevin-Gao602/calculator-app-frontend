<template>
  <div class="calculator-container">
    <div class="calculator">
      <h1>Calculator</h1>
      
      <!-- DISPLAY -->
      <div class="display">
        <div class="display-content">
          <div v-if="displayValue !== null" class="result">
            {{ displayValue }}
          </div>
          <div v-else class="placeholder">0</div>
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
      
      <!-- Button -->
      <div class="buttons-grid">
        <!-- Clear_Botton -->
        <button @click="clear" class="btn btn-clear">C</button>
        <button @click="clearEntry" class="btn btn-clear">CE</button>
        <button @click=""></button>
        <button @click=""></button>
        
        <!-- 第二行：7, 8, 9, ÷ -->
        <button @click="inputNumber(7)" class="btn btn-number">7</button>
        <button @click="inputNumber(8)" class="btn btn-number">8</button>
        <button @click="inputNumber(9)" class="btn btn-number">9</button>
        <button @click="inputOperation('/')" class="btn btn-operator">÷</button>
        
        <!-- 第三行：4, 5, 6, × -->
        <button @click="inputNumber(4)" class="btn btn-number">4</button>
        <button @click="inputNumber(5)" class="btn btn-number">5</button>
        <button @click="inputNumber(6)" class="btn btn-number">6</button>
        <button @click="inputOperation('*')" class="btn btn-operator">×</button>
        
        <!-- 第四行：1, 2, 3, - -->
        <button @click="inputNumber(1)" class="btn btn-number">1</button>
        <button @click="inputNumber(2)" class="btn btn-number">2</button>
        <button @click="inputNumber(3)" class="btn btn-number">3</button>
        <button @click="inputOperation('-')" class="btn btn-operator">-</button>
        
        <!-- 第五行：0, ., =, + -->
        <button @click="inputNumber(0)" class="btn btn-number btn-zero">0</button>
        <button @click="inputDecimal" class="btn btn-number">.</button>
        <button @click="calculate" :disabled="loading" class="btn btn-equals">
          {{ loading ? '...' : '=' }}
        </button>
        <button @click="inputOperation('+')" class="btn btn-operator">+</button>
      </div>
    </div>
  </div>
</template>

<script>
import { calculatorAPI } from '@/services/api.js';

export default {
  name: 'Calculator',
  data() {
    return {
      operand1: null,      // 第一个操作数
      operand2: null,      // 第二个操作数（当前输入）
      operation: null,     // 运算符
      displayValue: null,  // 显示的值
      error: null,         // 错误信息
      loading: false,      // 加载状态
      isNewNumber: true    // 是否开始输入新数字
    };
  },
  methods: {
    // 输入数字
    inputNumber(number) {
      this.error = null;
      
      if (this.isNewNumber) {
        // 开始输入新数字
        this.operand2 = number;
        this.displayValue = number;
        this.isNewNumber = false;
      } else {
        // 继续输入数字（拼接）
        if (this.operand2 === null) {
          this.operand2 = number;
        } else {
          this.operand2 = parseFloat(this.operand2.toString() + number.toString());
        }
        this.displayValue = this.operand2;
      }
    },
    
    // 输入小数点
    inputDecimal() {
      this.error = null;
      
      if (this.isNewNumber) {
        this.operand2 = 0;
        this.displayValue = '0.';
        this.isNewNumber = false;
      } else {
        const currentValue = this.operand2 !== null ? this.operand2.toString() : '0';
        if (!currentValue.includes('.')) {
          this.operand2 = parseFloat(currentValue + '.');
          this.displayValue = this.operand2.toString() + '.';
        }
      }
    },
    
    // 输入运算符
    inputOperation(op) {
      this.error = null;
      
      // 如果已经有操作数和运算符，先计算结果
      if (this.operand1 !== null && this.operand2 !== null && this.operation) {
        this.calculate();
        return;
      }
      
      // 设置第一个操作数
      if (this.operand2 !== null) {
        this.operand1 = this.operand2;
        this.operand2 = null;
      }
      
      // 设置运算符
      this.operation = op;
      this.isNewNumber = true;
    },
    
    // 执行计算
    async calculate() {
      // 验证
      if (this.operand1 === null || this.operand2 === null || !this.operation) {
        this.error = 'Expression incomplete';
        return;
      }
      
      this.error = null;
      this.loading = true;
      
      try {
        // 调用后端 API
        const response = await calculatorAPI.calculate(
          this.operand1,
          this.operand2,
          this.operation
        );
        
        if (response.success) {
          // 计算成功
          this.displayValue = response.result;
          this.operand1 = response.result;
          this.operand2 = null;
          this.operation = null;
          this.isNewNumber = true;
        } else {
          // 计算失败（业务错误）
          this.error = response.message;
          this.displayValue = null;
        }
      } catch (err) {
        // 网络错误或其他错误
        this.error = err.message;
        this.displayValue = null;
      } finally {
        this.loading = false;
      }
    },
    
    // 清除所有（C）
    clear() {
      this.operand1 = null;
      this.operand2 = null;
      this.operation = null;
      this.displayValue = null;
      this.error = null;
      this.isNewNumber = true;
    },
    
    // 清除当前输入（CE）
    clearEntry() {
      this.operand2 = null;
      this.displayValue = null;
      this.error = null;
      this.isNewNumber = true;
    }
  }
};
</script>

<style scoped>
.calculator-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.calculator {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 28px;
}

/* 显示屏幕 */
.display {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.display-content {
  text-align: right;
}

.result {
  color: #4CAF50;
  font-size: 36px;
  font-weight: bold;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.placeholder {
  color: #666;
  font-size: 36px;
  text-align: right;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  margin-top: 10px;
  text-align: right;
}

/* 按钮网格 */
.buttons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.btn {
  padding: 20px;
  font-size: 20px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 数字按钮 */
.btn-number {
  background: #f5f5f5;
  color: #333;
}

.btn-number:hover:not(:disabled) {
  background: #e0e0e0;
}

/* 运算符按钮 */
.btn-operator {
  background: #ff9800;
  color: white;
}

.btn-operator:hover:not(:disabled) {
  background: #f57c00;
}

/* 等号按钮 */
.btn-equals {
  background: #4CAF50;
  color: white;
  grid-column: span 1;
}

.btn-equals:hover:not(:disabled) {
  background: #45a049;
}

/* 清除按钮 */
.btn-clear {
  background: #f44336;
  color: white;
}

.btn-clear:hover:not(:disabled) {
  background: #da190b;
}

/* 0 按钮占两列 */
.btn-zero {
  grid-column: span 1;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .calculator {
    padding: 20px;
  }
  
  .btn {
    padding: 15px;
    font-size: 18px;
  }
  
  .result,
  .placeholder {
    font-size: 28px;
  }
}
</style>