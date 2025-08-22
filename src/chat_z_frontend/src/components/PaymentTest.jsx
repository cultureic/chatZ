import React, { useState } from 'react';
import paymentService from '../services/paymentService.js';

const PaymentTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const testPayment = async () => {
    setIsLoading(true);
    setStatus('Initializing payment...');
    setError('');

    try {
      // Test payment for product_1
      const result = await paymentService.openPasswordChannelPayment();
      setStatus(`Payment successful! Transaction ID: ${result.transactionId}`);
      console.log('Payment result:', result);
    } catch (err) {
      setError(`Payment failed: ${err.message}`);
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      padding: '20px',
      border: '2px solid #ccc',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🧪 Payment SDK Test</h3>
      
      <button
        onClick={testPayment}
        disabled={isLoading}
        style={{
          background: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '10px'
        }}
      >
        {isLoading ? 'Processing...' : '💰 Test Payment (Product 1)'}
      </button>

      {status && (
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          {status}
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>This will open the ckPay modal for product_1</p>
        <p>Check console for detailed logs</p>
      </div>
    </div>
  );
};

export default PaymentTest;
