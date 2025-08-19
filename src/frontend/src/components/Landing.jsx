import React, { useState } from 'react';
import { useAuth } from '../hooks/Auth';
import { MessageCircle, Users, Zap, Shield, Globe, Smartphone } from 'lucide-react';

const Landing = () => {
  const { login, isLoading } = useAuth();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-chat-primary via-purple-500 to-chat-secondary">
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Logo and Title */}
            <div className="animate-bounce-gentle mb-8">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
                Chat Z 🐆
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              The future of decentralized social messaging on the Internet Computer
            </p>
            
            <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
              Secure, private, and unstoppable. Join the revolution of Web3 communication.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || isLoginLoading}
              className="bg-chat-accent hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isLoginLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                'Login with Internet Identity'
              )}
            </button>
            
            <p className="text-white/70 text-sm mt-4">
              No email or password required - just your Internet Identity
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Chat Z?
            </h2>
            <p className="text-xl text-white/80">
              Built on the Internet Computer for maximum security and decentralization
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-chat-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                100% Decentralized
              </h3>
              <p className="text-white/80">
                No central servers, no single point of failure. Your data lives on the blockchain.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Real-time Chat
              </h3>
              <p className="text-white/80">
                Instant messaging with image sharing and channel support.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Community Driven
              </h3>
              <p className="text-white/80">
                Create channels, build communities, and connect with like-minded people.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Lightning Fast
              </h3>
              <p className="text-white/80">
                Built on Internet Computer for web-speed blockchain performance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Global Access
              </h3>
              <p className="text-white/80">
                Access from anywhere in the world. No restrictions, no censorship.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Mobile Ready
              </h3>
              <p className="text-white/80">
                Responsive design works perfectly on all devices and screen sizes.
              </p>
            </div>
          </div>
        </div>

        {/* Twitter Mock Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              🐆 Live Development Updates
            </h3>
            
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">Z</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-white">Z 🐆</span>
                      <span className="text-blue-400">@Zforever97</span>
                      <span className="text-white/60 text-sm">51m ago</span>
                    </div>
                    <p className="text-white/90">
                      Live version #2 now It's PWA and you can send Images.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-white/10 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">P</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-white">Plena</span>
                      <span className="text-blue-400">@PlenaFinance</span>
                      <span className="text-white/60 text-sm">1h ago</span>
                    </div>
                    <p className="text-white/90">
                      bullish on vibe coding 💯
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-white/10 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">Z</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-white">Z 🐆</span>
                      <span className="text-blue-400">@Zforever97</span>
                      <span className="text-white/60 text-sm">38m ago</span>
                    </div>
                    <p className="text-white/90">
                      Deploy to ICP. You will get backend functionality, object storage all in one place, beyond a simple front end ✌🏻
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
