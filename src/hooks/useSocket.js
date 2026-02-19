import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

/**
 * useSocket — subscribe to socket events cleanly
 * Auto-cleans up on unmount
 *
 * Usage:
 *   useSocket("round:started", (data) => setRound(data));
 */
export function useSocket(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}

/**
 * useSocketMany — subscribe to multiple events at once
 *
 * Usage:
 *   useSocketMany({
 *     "round:started": (d) => ...,
 *     "coins:updated": (d) => ...,
 *   });
 */
export function useSocketMany(handlers) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
