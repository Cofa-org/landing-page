import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { loadTurnstile } from "../../lib/loadTurnstile";

const Turnstile = forwardRef(
  (
    {
      siteKey,
      onVerify,
      onExpire,
      onError,
    },
    ref,
  ) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const mountedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      reset() {
        if (
          widgetIdRef.current !== null &&
          window.turnstile
        ) {
          window.turnstile.reset(
            widgetIdRef.current,
          );
        }
      },
    }));

    useEffect(() => {
      const controller = new AbortController();

      const initialize = async () => {
        if (mountedRef.current) {
          return;
        }

        mountedRef.current = true;

        try {
          const turnstile = await loadTurnstile();

          if (controller.signal.aborted) return;

          if (widgetIdRef.current !== null) {
            return;
          }

          widgetIdRef.current = turnstile.render(
            containerRef.current,
            {
              sitekey: siteKey,
              callback(token) {
                onVerify?.(token);
              },

              "expired-callback"() {
                onExpire?.();
              },

              "error-callback"(error) {
                onError?.(error);
              },
            },
          );
        } catch (err) {
          if (!controller.signal.aborted) throw err;
        }
      };

      initialize();

      return () => {
        controller.abort();
        mountedRef.current = false;

        if (
          widgetIdRef.current !== null &&
          window.turnstile
        ) {
          try {
            window.turnstile.remove(
              widgetIdRef.current,
            );
          } catch {
            // Turnstile puede lanzar si el widget ya fue removido
          }
        }

        widgetIdRef.current = null;
      };
    }, [
      siteKey,
      onVerify,
      onExpire,
      onError,
    ]);

    return <div ref={containerRef} />;
  },
);

Turnstile.displayName = "Turnstile";

export default Turnstile;