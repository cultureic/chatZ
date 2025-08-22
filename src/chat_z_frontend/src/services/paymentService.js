// Simple Payment Service for ckPay SDK Integration
class PaymentService {
  constructor() {
    this.canisterId = '6tzcr-tqaaa-aaaag-aufoa-cai';
    this.isInitialized = false;
  }

  // Wait for SDK to be available
  async waitForSDK(timeout = 10000) {
    const startTime = Date.now();
    console.log('🔍 Waiting for ckPay SDK to be available...');
    console.log('🌐 Current window.ckPaySDK:', window.ckPaySDK);
    
    return new Promise((resolve, reject) => {
      const checkSDK = () => {
        const elapsed = Date.now() - startTime;
        
        if (window.ckPaySDK && window.ckPaySDK.PaymentComponent) {
          console.log('✅ SDK found after', elapsed + 'ms');
          console.log('🔧 SDK PaymentComponent:', window.ckPaySDK.PaymentComponent);
          resolve(true);
        } else if (elapsed > timeout) {
          console.error('⏰ SDK loading timeout after', elapsed + 'ms');
          console.error('🌐 Final window.ckPaySDK state:', window.ckPaySDK);
          console.error('📜 Available window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('ck')));
          reject(new Error(`SDK loading timeout after ${elapsed}ms`));
        } else {
          if (elapsed % 1000 === 0) { // Log every second
            console.log('⏳ Still waiting for SDK... elapsed:', elapsed + 'ms');
            console.log('🌐 Current window.ckPaySDK:', window.ckPaySDK);
          }
          setTimeout(checkSDK, 100);
        }
      };
      checkSDK();
    });
  }

  // Initialize the payment service
  async initialize() {
    try {
      console.log('🔧 Initializing payment service...');
      
      // Wait for SDK to be available (loaded from HTML)
      await this.waitForSDK();
      
      if (!window.ckPaySDK || !window.ckPaySDK.PaymentComponent) {
        throw new Error('ckPay SDK not available');
      }

      // Ensure payment container exists
      this.ensurePaymentContainer();
      
      // Initialize the SDK
      console.log('⚙️ Setting canister ID:', this.canisterId);
      window.ckPaySDK.PaymentComponent.setCanisterId(this.canisterId);
      
      console.log('⚙️ Initializing SDK with paymentContainer...');
      window.ckPaySDK.PaymentComponent.initialize('paymentContainer');
      
      console.log('✅ Payment service initialized successfully');
      this.isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ Payment service initialization failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      this.isInitialized = false;
      throw error;
    }
  }

  // Ensure payment container exists (should be in HTML already)
  ensurePaymentContainer() {
    const container = document.getElementById('paymentContainer');
    if (container) {
      console.log('✅ Payment container found in HTML');
      return container;
    } else {
      console.warn('⚠️ Payment container not found in HTML, creating one...');
      const newContainer = document.createElement('div');
      newContainer.id = 'paymentContainer';
      newContainer.style.position = 'fixed';
      newContainer.style.top = '0';
      newContainer.style.left = '0';
      newContainer.style.width = '100%';
      newContainer.style.height = '100%';
      newContainer.style.zIndex = '10000';
      newContainer.style.pointerEvents = 'none';
      newContainer.style.display = 'none';
      
      document.body.appendChild(newContainer);
      console.log('📦 Payment container created dynamically');
      return newContainer;
    }
  }

  // Open payment modal for encrypted channel creation (product_1)
  async openPasswordChannelPayment() {
    try {
      console.log('🔒 Opening payment modal for password channel...');
      
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return new Promise((resolve, reject) => {
        try {
          const props = {
            productId: 'product_1', // Use product 1
            quantity: 1
          };

          // Show container
          const container = document.getElementById('paymentContainer');
          if (container) {
            container.style.display = 'block';
            container.style.pointerEvents = 'auto';
          }

          window.ckPaySDK.PaymentComponent.renderPaymentModal(props, (result) => {
            // Hide container
            if (container) {
              container.style.display = 'none';
              container.style.pointerEvents = 'none';
            }

            if (result.success) {
              console.log('✅ Payment successful for encrypted channel creation!');
              console.log('Transaction ID:', result.transactionId);
              console.log('Product:', result.product?.name || 'Password Channel Access');
              console.log('Amount Paid:', result.amount, result.currency?.toUpperCase());
              
              resolve({
                success: true,
                transactionId: result.transactionId,
                product: result.product,
                amount: result.amount,
                currency: result.currency,
                coupon: result.coupon
              });
            } else {
              console.error('❌ Payment failed:', result.error);
              reject(new Error(result.error || 'Payment failed'));
            }
          });
        } catch (error) {
          // Hide container on error
          const container = document.getElementById('paymentContainer');
          if (container) {
            container.style.display = 'none';
            container.style.pointerEvents = 'none';
          }
          console.error('❌ Error opening payment modal:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ Failed to open payment modal:', error);
      throw error;
    }
  }

  // Set custom canister ID
  setCanisterId(canisterId) {
    this.canisterId = canisterId;
    if (this.isInitialized && window.ckPaySDK) {
      window.ckPaySDK.PaymentComponent.setCanisterId(canisterId);
    }
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && window.ckPaySDK && window.ckPaySDK.PaymentComponent;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
