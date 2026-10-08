import './styles/index.css';
import { MainGame } from './main-game.ts';

const mainGame = new MainGame();
void mainGame.begin();

export const dispose = (): void => mainGame.dispose();

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
