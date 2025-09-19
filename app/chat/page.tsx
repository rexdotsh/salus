'use client';

import { useState, Fragment, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Response } from '@/components/ai-elements/response';
import { Button } from '@/components/ui/button';
import { CopyIcon, RefreshCcwIcon, ArrowLeft } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';

const AVAILABLE_MODEL = 'Intelligent-Internet/II-Medical-8B';

// Extract the component that uses useSearchParams
function ChatPageContent() {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(AVAILABLE_MODEL);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  });

  useEffect(() => {
    // Check for session ID in URL params first
    const sessionFromParams = searchParams.get('sessionId');
    if (sessionFromParams) {
      setSessionId(sessionFromParams);
      return;
    }

    // Fallback: extract session ID from referrer if it's from a waiting room
    const referrer = document.referrer;
    const waitingRoomMatch = referrer.match(/\/session\/([^\/]+)\/waiting/);
    if (waitingRoomMatch) {
      setSessionId(waitingRoomMatch[1]);
    }
  }, [searchParams]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) return;

    sendMessage(
      {
        text: message.text as string,
      },
      {
        body: { model },
      },
    );
    setInput('');
  };

  const suggestions = ['Hello!', 'What can you do?', 'Tell me a joke.'];

  const handleBackToWaitingRoom = () => {
    if (sessionId) {
      router.push(`/session/${sessionId}/waiting`);
    } else {
      // Fallback: go back in history
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToWaitingRoom}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Waiting Room
            </Button>
          </div>
        </div>

        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id} className="mb-2">
                {message.role === 'assistant' &&
                  message.parts.filter((part) => part.type === 'source-url')
                    .length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === 'source-url')
                        .map((part: any, i: number) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source href={part.url} title={part.url} />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}

                {message.parts.map((part: any, i: number) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>{part.text}</Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' &&
                            message.id === messages.at(-1)?.id && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() => regenerate()}
                                  label={'Retry'}
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                                <Action
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label={'Copy'}
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                        </Fragment>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === 'streaming' &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}

            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mb-2">
          <Suggestions>
            {suggestions.map((s) => (
              <Suggestion
                key={s}
                suggestion={s}
                onClick={(sugg) => sendMessage({ text: sugg })}
              />
            ))}
          </Suggestions>
        </div>

        <PromptInput onSubmit={handleSubmit} className="mt-2">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputModelSelect
                onValueChange={(v) => setModel(v)}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  <PromptInputModelSelectItem value={AVAILABLE_MODEL}>
                    {AVAILABLE_MODEL}
                  </PromptInputModelSelectItem>
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input && status !== 'streaming'}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}

function ChatPageLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Waiting Room
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
