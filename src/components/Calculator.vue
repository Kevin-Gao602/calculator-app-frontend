<template>
  <div class="calculator-container">
    <div class="calculator">
      <h1>计算器</h1>
      
      <!-- 显示屏幕 -->
      <div class="display">
        <div class="display-content">
          <div v-if="displayValue !== null" class="result">
            {{ formatDisplay(displayValue) }}
          </div>
          <div v-else class="placeholder">0</div>
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
      
      <!-- 按钮区域 -->
      <div class="buttons-grid">
        <!-- 第一行：%, CE, C, 退格 -->
        <button @click="percent" class="btn btn-function">%</button>
        <button @click="clearEntry" class="btn btn-function">CE</button>
        <button @click="clear" class="btn btn-function">C</button>
        <button @click="backspace" class="btn btn-function">⌫</button>
        
        <!-- 第二行：1/x, x², ²√x, ÷ -->
        <button @click="reciprocal" class="btn btn-function">1/x</button>
        <button @click="square" class="btn btn-function">x²</button>
        <button @click="squareRoot" class="btn btn-function">²√x</button>
        <button @click="inputOperation('/')" class="btn btn-operator">÷</button>
        
        <!-- 第三行：7, 8, 9, × -->
        <button @click="inputNumber(7)" class="btn btn-number">7</button>
        <button @click="inputNumber(8)" class="btn btn-number">8</button>
        <button @click="inputNumber(9)" class="btn btn-number">9</button>
        <button @click="inputOperation('*')" class="btn btn-operator">×</button>
        
        <!-- 第四行：4, 5, 6, - -->
        <button @click="inputNumber(4)" class="btn btn-number">4</button>
        <button @click="inputNumber(5)" class="btn btn-number">5</button>
        <button @click="inputNumber(6)" class="btn btn-number">6</button>
        <button @click="inputOperation('-')" class="btn btn-operator">-</button>
        
        <!-- 第五行：1, 2, 3, + -->
        <button @click="inputNumber(1)" class="btn btn-number">1</button>
        <button @click="inputNumber(2)" class="btn btn-number">2</button>
        <button @click="inputNumber(3)" class="btn btn-number">3</button>
        <button @click="inputOperation('+')" class="btn btn-operator">+</button>
        
        <!-- 第六行：+/−, 0, ., = -->
        <button @click="negate" class="btn btn-function">+/−</button>
        <button @click="inputNumber(0)" class="btn btn-number">0</button>
        <button @click="inputDecimal" class="btn btn-number">.</button>
        <button @click="calculate" :disabled="loading" class="btn btn-equals">
          {{ loading ? '...' : '=' }}
        </button>
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
      operand1: null,        // 第一个操作数
      operand2: null,        // 第二个操作数（当前输入）
      operation: null,       // 运算符
      displayValue: null,    // 显示的值
      error: null,          // 错误信息
      loading: false,       // 加载状态
      isNewNumber: true,    // 是否开始输入新数字
      hasResult: false      // 是否有计算结果（用于连续运算）
    };
  },
  methods: {
    // 格式化显示
    formatDisplay(value) {
      if (value === null) return '0';
      if (Number.isInteger(value)) {
        return value.toString();
      }
      return parseFloat(value.toFixed(10)).toString();
    },
    
    // 输入数字
    inputNumber(number) {
      this.error = null;
      
      // 如果有计算结果，开始新的计算
      if (this.hasResult && this.operation === null) {
        this.clear();
      }
      
      if (this.isNewNumber) {
        this.operand2 = number;
        this.displayValue = number;
        this.isNewNumber = false;
        this.hasResult = false;
      } else {
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
      
      // 如果有计算结果，开始新的计算
      if (this.hasResult && this.operation === null) {
        this.clear();
      }
      
      if (this.isNewNumber) {
        this.operand2 = 0;
        this.displayValue = '0.';
        this.isNewNumber = false;
        this.hasResult = false;
      } else {
        const currentValue = this.operand2 !== null ? this.operand2.toString() : '0';
        if (!currentValue.includes('.')) {
          this.operand2 = parseFloat(currentValue + '.');
          this.displayValue = this.operand2.toString() + '.';
        }
      }
    },
    
    // 输入运算符（关键修改点）
    inputOperation(op) {
      this.error = null;
      
      // 情况1：如果已经有 operand1 和 operand2，先计算结果
      if (this.operand1 !== null && this.operand2 !== null && this.operation) {
        // 先计算当前表达式
        this.calculateInternal().then(() => {
          // 计算完成后，设置新的运算符
          this.operation = op;
          this.isNewNumber = true;
        });
        return;
      }
      
      // 情况2：如果有计算结果，将其作为第一个操作数
      if (this.hasResult && this.operand1 === null) {
        this.operand1 = this.displayValue;
        this.operand2 = null;
        this.operation = op;
        this.isNewNumber = true;
        this.hasResult = false;
        return;
      }
      
      // 情况3：正常设置运算符
      if (this.operand2 !== null) {
        this.operand1 = this.operand2;
        this.operand2 = null;
      }
      
      this.operation = op;
      this.isNewNumber = true;
    },
    
    // 执行计算（公开方法）
    async calculate() {
      if (this.operand1 === null || this.operand2 === null || !this.operation) {
        this.error = '请输入完整的计算表达式';
        return;
      }
      
      await this.calculateInternal();
    },
    
    // 内部计算方法（用于连续运算）
    async calculateInternal() {
      if (this.operand1 === null || this.operand2 === null || !this.operation) {
        return;
      }
      
      this.error = null;
      this.loading = true;
      
      try {
        const response = await calculatorAPI.calculate(
          this.operand1,
          this.operand2,
          this.operation
        );
        
        if (response.success) {
          // 计算成功
          this.displayValue = response.result;
          // 关键：将结果作为下一次计算的第一个操作数
          this.operand1 = response.result;
          // 不清空 operand2，保留用于显示
          // 标记有计算结果
          this.hasResult = true;
          // 不清空 operation，允许继续使用相同运算符
        } else {
          this.error = response.message;
          this.displayValue = null;
          this.hasResult = false;
        }
      } catch (err) {
        this.error = err.message;
        this.displayValue = null;
        this.hasResult = false;
      } finally {
        this.loading = false;
      }
    },
    
    // 单操作数运算的通用方法
    async performSingleOperation(operation) {
      const operand = this.operand2 !== null ? this.operand2 : this.operand1;
      
      if (operand === null) {
        this.error = '请先输入数字';
        return;
      }
      
      this.error = null;
      this.loading = true;
      
      try {
        console.log('执行单操作数运算:', { operand, operation });
        const response = await calculatorAPI.calculateSingle(operand, operation);
        
        if (response.success) {
          this.displayValue = response.result;
          // 如果当前有 operand2，更新它；否则更新 operand1
          if (this.operand2 !== null) {
            this.operand2 = response.result;
          } else {
            this.operand1 = response.result;
          }
          this.isNewNumber = true;
          this.hasResult = true;
        } else {
          this.error = response.message || '计算失败';
        }
      } catch (err) {
        console.error('单操作数运算捕获错误:', err);
        this.error = err.message || '无法连接到服务器，请检查后端服务是否运行';
        this.displayValue = null;
        this.hasResult = false;
      } finally {
        this.loading = false;
      }
    },
    
    // 取倒数 1/x
    reciprocal() {
      this.performSingleOperation('reciprocal');
    },
    
    // 平方 x²
    square() {
      this.performSingleOperation('square');
    },
    
    // 平方根 ²√x
    squareRoot() {
      this.performSingleOperation('sqrt');
    },
    
    // 百分号 %
    percent() {
      this.performSingleOperation('percent');
    },
    
    // 正负号切换 +/−
    negate() {
      this.performSingleOperation('negate');
    },
    
    // 退格
    backspace() {
      this.error = null;
      
      if (this.operand2 !== null) {
        const str = this.operand2.toString();
        if (str.length > 1) {
          this.operand2 = parseFloat(str.slice(0, -1));
          this.displayValue = this.operand2;
        } else {
          this.operand2 = null;
          this.displayValue = null;
          this.isNewNumber = true;
        }
      }
    },
    
    // 清除所有
    clear() {
      this.operand1 = null;
      this.operand2 = null;
      this.operation = null;
      this.displayValue = null;
      this.error = null;
      this.isNewNumber = true;
      this.hasResult = false;
    },
    
    // 清除当前输入
    clearEntry() {
      this.operand2 = null;
      this.displayValue = this.operand1 !== null ? this.operand1 : null;
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

.buttons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.btn {
  padding: 20px;
  font-size: 18px;
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

.btn-number {
  background: #f5f5f5;
  color: #333;
}

.btn-number:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-operator {
  background: #ff9800;
  color: white;
}

.btn-operator:hover:not(:disabled) {
  background: #f57c00;
}

.btn-function {
  background: #e0e0e0;
  color: #333;
  font-size: 16px;
}

.btn-function:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-equals {
  background: #2196F3;
  color: white;
}

.btn-equals:hover:not(:disabled) {
  background: #1976D2;
}

@media (max-width: 480px) {
  .calculator {
    padding: 20px;
  }
  
  .btn {
    padding: 15px;
    font-size: 16px;
  }
  
  .result,
  .placeholder {
    font-size: 28px;
  }
}
</style>