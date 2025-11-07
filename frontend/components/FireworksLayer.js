// frontend/components/FireworksLayer.js
import { forwardRef, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';

const emojis = ['🎉','✨','🎆','🎇','💫','🌟'];

function burst(){
  const now = Date.now();
  return Array.from({length: 40}).map((_,i)=>({
    id: `${now}-${i}`,
    x: 10 + Math.random()*80,
    y: 30 + Math.random()*40,
    dx: (Math.random()*2-1)*30,
    dy: - (10 + Math.random()*30),
    emoji: emojis[(Math.random()*emojis.length)|0],
    dur: 1.8 + Math.random()*0.8,
    size: 20 + Math.random()*16,
  }));
}

const FireworksLayer = forwardRef(function FireworksLayer(_, ref){
  const [items, setItems] = useState([]);

  useImperativeHandle(ref, () => ({
    fire() {
      const b = burst();
      setItems(prev => [...prev, ...b]);
      setTimeout(()=> {
        setItems(prev => prev.filter(p => !b.find(q=>q.id===p.id)));
      }, Math.max(...b.map(k=>k.dur))*1000 + 300);
    }
  }), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
      {items.map(p=>(
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: `${p.x}vw`, y: `${p.y}vh`, scale: 0.8 }}
          animate={{ opacity: [0,1,1,0], x: [`${p.x}vw`,`${p.x+p.dx}vw`], y: [`${p.y}vh`,`${p.y+p.dy}vh`], scale:[0.8,1,1] }}
          transition={{ duration: p.dur, ease: 'easeOut', times:[0,0.15,0.8,1] }}
          style={{ position:'absolute', fontSize: `${p.size}px` }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
});

export default FireworksLayer;