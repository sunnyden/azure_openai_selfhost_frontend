import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConversationProvider, useConversationContext } from './ConversationContext';

// Mock the dependencies
jest.mock('../../../ui/component/chat/ChatHistory', () => ({
    ChatHistory: () => <div>Chat History</div>
}));

jest.mock('./useApiClient', () => ({
    useApiClient: () => ({
        chatClient: {
            requestCompletionStream: jest.fn()
        },
        mcpHubService: {
            getSessionId: jest.fn()
        }
    })
}));

jest.mock('./ModelContext', () => ({
    useModelContext: () => ({
        currentModel: { identifier: 'test-model' }
    })
}));

jest.mock('./ConversationHistoryContext', () => ({
    useConversationHistory: () => ({
        getCurrentConversation: () => ({ messages: [] }),
        updateCurrentConversation: jest.fn(),
        currentConversationId: 'test-conversation-id',
        deleteMessage: jest.fn(),
        updateMessage: jest.fn()
    })
}));

jest.mock('./MCPContext', () => ({
    useMCPContext: () => ({
        isHubRunning: false
    })
}));

// Test component to access the context
function TestComponent() {
    const context = useConversationContext();
    return (
        <div>
            <span data-testid="conversation-length">{context.currentConversation.length}</span>
        </div>
    );
}

// Test the enhanced error message function
describe('Enhanced Error Handling', () => {
    test('provides specific error messages for different error types', () => {
        // Since getEnhancedErrorMessage is internal, we'll test it indirectly
        // by creating a mock component that uses it
        const { getEnhancedErrorMessage } = require('./ConversationContext');
        
        // Test HTTP 401 error
        const authError = new Error('HTTP error! status: 401');
        expect(getEnhancedErrorMessage(authError)).toContain('Authentication Error');
        expect(getEnhancedErrorMessage(authError)).toContain('session has expired');
        
        // Test HTTP 429 error  
        const rateLimitError = new Error('HTTP error! status: 429');
        expect(getEnhancedErrorMessage(rateLimitError)).toContain('Rate Limit Exceeded');
        expect(getEnhancedErrorMessage(rateLimitError)).toContain('try again');
        
        // Test network error
        const networkError = new Error('Failed to fetch');
        expect(getEnhancedErrorMessage(networkError)).toContain('Connection Error');
        expect(getEnhancedErrorMessage(networkError)).toContain('internet connection');
        
        // Test JSON parsing error
        const jsonError = new Error('JSON parse error');
        expect(getEnhancedErrorMessage(jsonError)).toContain('Response Format Error');
        expect(getEnhancedErrorMessage(jsonError)).toContain('try again');
        
        // Test generic error
        const genericError = new Error('Unknown error');
        expect(getEnhancedErrorMessage(genericError)).toContain('Request Failed');
        expect(getEnhancedErrorMessage(genericError)).toContain('try refreshing the page');
    });
});

describe('ConversationProvider', () => {
    test('renders without crashing', () => {
        render(
            <ConversationProvider>
                <TestComponent />
            </ConversationProvider>
        );
        
        expect(screen.getByTestId('conversation-length')).toBeInTheDocument();
    });
});