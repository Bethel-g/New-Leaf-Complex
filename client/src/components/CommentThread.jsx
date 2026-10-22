import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { formatDate } from './TicketTable';
import { useTranslation } from '../i18n';

/**
 * The conversation on a request: who said what, when, and a reply box.
 *
 * Submitting is owned by the caller because the same thread is written from a
 * task page (`POST /tickets/:id/comments`) and from a notification
 * (`POST /notifications/:id/reply`) - both end up as the same comment.
 */
export default function CommentThread({
  comments,
  onSubmit,
  value,
  onChange,
  title,
  placeholder,
  disabled = false,
  disabledHint = null,
  emptyText,
  inputId = 'comment-input',
  multiline = false,
}) {
  const { t } = useTranslation();
  const [internal, setInternal] = useState('');
  const isControlled = value !== undefined;
  const draft = isControlled ? value : internal;

  const setDraft = (next) => {
    if (isControlled) onChange?.(next);
    else setInternal(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    const sent = await onSubmit(text);
    if (sent !== false) setDraft('');
  };

  const thread = comments || [];
  const heading = title || t('common.labels.comments');
  const inputPlaceholder = placeholder || t('common.comments.placeholder');
  const emptyMessage = emptyText || t('common.comments.empty');

  return (
    <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-blue-soft-text" />
        <h3 className="font-semibold text-gray-800">{heading}</h3>
        {thread.length > 0 && <span className="text-xs text-gray-400">{thread.length}</span>}
      </div>
      <div className="px-5 py-4 space-y-4">
        {thread.length === 0 && <div className="text-gray-400 text-sm">{emptyMessage}</div>}
        {thread.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-soft-strong text-blue-soft-text flex items-center justify-center text-xs font-semibold shrink-0">
              {c.user_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{c.user_name}</span>
                <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{c.comment}</p>
            </div>
          </div>
        ))}

        {disabled ? (
          disabledHint && <div className="pt-3 border-t border-gray-100 text-sm text-gray-500">{disabledHint}</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 pt-3 border-t border-gray-100">
            <label htmlFor={inputId} className="sr-only">{inputPlaceholder}</label>
            {multiline ? (
              <textarea
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder={inputPlaceholder}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            ) : (
              <input
                id={inputId}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={inputPlaceholder}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            )}
            <button
              type="submit"
              disabled={!draft.trim()}
              className="self-end px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> {t('common.actions.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
