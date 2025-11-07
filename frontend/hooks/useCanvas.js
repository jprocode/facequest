import { useCallback } from 'react';
export function useCanvas(){
  const onStroke = useCallback((seg)=>{ /* send over DataChannel later */ }, []);
  return { onStroke };
}