import React, { FC } from 'react';
import { ChatSdk, Thread, LivechatThread } from '@nice-devone/nice-cxone-chat-web-sdk';
import { MessagesBoard } from '../Chat/MessagesBoard/MessagesBoard';
import { M1SendForm } from './M1SendForm';
import { Customer } from '../Chat/Customer/Customer';
import { useChat } from './useChat';

interface M1ChatBodyProps {
  sdk: ChatSdk;
  thread: Thread | LivechatThread;
}

export const M1ChatBody: FC<M1ChatBodyProps> = ({ sdk, thread }) => {
  const {
    messages,
    customerName,
    agentName,
    agentTyping,
    handleMessageSend,
    handleFileUpload,
    handleTyping,
    handleCustomerNameChange,
    handlePostback,
  } = useChat(sdk, thread);

  return (
    <>
      {/* Chat Body */}
      <div className="chat-body">
        <div className="messages-container">
          {/* Customer Name Input if not set */}
          {!customerName && (
            <div className="message bot-message">
              <Customer
                currentName={customerName}
                onChange={handleCustomerNameChange}
              />
            </div>
          )}
          
          {/* Messages */}
          <MessagesBoard
            agentName={agentName}
            agentTyping={agentTyping}
            messages={messages}
            onPostback={handlePostback}
          />
          
          {/* Initial Hot Topics - shown when no messages */}
          {messages.size === 0 && (
            <>
              <div className="message bot-message">
                <p>Hello! I'm Mindy, your M1 Chatbot. How can I help you today?</p>
              </div>
              
              <div className="message bot-message">
                <h3 className="section-title">Hot Topics</h3>
                <div className="topic-list">
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("Tell me about what's next for M1")}
                  >
                    ⏳ be part of what's next
                  </button>
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("I need help with a scam alert")}
                  >
                    ⚠️ Scam Alert: Steps to Take
                  </button>
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("Tell me about eSIM")}
                  >
                    💭 Know more about eSIM
                  </button>
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("Tell me about M1 Daily Passport")}
                  >
                    🧳 Roam with M1 Daily Passport!
                  </button>
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("Tell me about M1 and SIMBA")}
                  >
                    📢 M1 + SIMBA : an important message
                  </button>
                </div>
              </div>
              
              <div className="message bot-message">
                <h3 className="section-title">Popular Questions</h3>
                <div className="topic-list">
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("Help me transition my M1 service")}
                  >
                    Transition Your M1 Service with Ease!
                  </button>
                  <button 
                    className="topic-btn"
                    onClick={() => handleMessageSend("I have questions about billing and payment")}
                  >
                    Billing & Payment for Your Bespoke Plan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Chat Footer */}
      <div className="chat-footer">
        <form className="message-form" onSubmit={(e) => { e.preventDefault(); }}>
          <div className="input-wrapper">
            <M1SendForm
              disabled={!customerName}
              onFileUpload={handleFileUpload}
              onTyping={handleTyping}
              onSubmit={handleMessageSend}
            />
          </div>
        </form>
      </div>
    </>
  );
};