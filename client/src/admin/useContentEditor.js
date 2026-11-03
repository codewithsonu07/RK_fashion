import { useState } from 'react';
import { admin } from './api';
import { applyContent, currentContent } from '../lib/content';

/**
 * Editing state for site content. Starts from what the site currently shows
 * (defaults + saved overrides) and saves the edited sections back as overrides.
 */
export function useContentEditor(keys) {
  const [draft, setDraft] = useState(() => {
    const c = currentContent();
    return Object.fromEntries(keys.map((k) => [k, c[k]]));
  });
  const [state, setState] = useState({ busy: false, error: null, msg: '', dirty: false });

  const update = (fn) => {
    setDraft((d) => {
      const next = structuredClone(d);
      fn(next);
      return next;
    });
    setState((s) => ({ ...s, msg: '', dirty: true }));
  };

  const save = async () => {
    setState((s) => ({ ...s, busy: true, error: null, msg: '' }));
    try {
      const { content: saved } = await admin.content();
      const { content } = await admin.saveContent({ ...saved, ...draft });
      applyContent(content);
      setState({ busy: false, error: null, msg: 'Saved — the website now shows these changes.', dirty: false });
    } catch (error) {
      setState((s) => ({ ...s, busy: false, error }));
    }
  };

  return { draft, update, save, state };
}
