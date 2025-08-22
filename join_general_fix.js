// Quick fix to join General channel
// Run this in the browser console if still having issues

async function joinGeneralChannel() {
  try {
    // Get the backend canister ID
    const response = await fetch('/.well-known/ic-domains');
    const backendCanisterId = 'uxrrr-q7777-77774-qaaaq-cai'; // Your backend canister ID
    
    console.log('Attempting to join General channel...');
    
    // This would be called from within the app context
    console.log('Please use the app interface to join the General channel');
    console.log('Or call: dfx canister call chat_z_backend join_channel "(1)" --ic');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the fix
joinGeneralChannel();
