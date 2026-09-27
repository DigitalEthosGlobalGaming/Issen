import './styles/index.css';
import { mount } from './ui/mount';
import { startGame } from './game.ts';

const root = mount();
const stop = startGame();
export function dispose(): void {
  stop();
  root.remove();
}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
