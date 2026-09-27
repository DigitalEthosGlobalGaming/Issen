import shell from './shell.html?raw';
import title from './screens/title.html?raw';
import gameOver from './screens/game-over.html?raw';
import armory from './screens/armory.html?raw';
import stats from './screens/stats.html?raw';
import share from './screens/share.html?raw';
import setup from './screens/setup.html?raw';
import shrine from './screens/shrine.html?raw';
import pause from './screens/pause.html?raw';
import trials from './screens/trials.html?raw';

const screens: Record<string, string> = {
  title,
  'game-over': gameOver,
  armory,
  stats,
  share,
  setup,
  shrine,
  pause,
  trials,
};

export function mount(): HTMLElement {
  const markup = shell.replace(/<!-- screen:([\w-]+) -->/g, (_, name: string) => {
    const template = screens[name];
    if (!template) throw new Error(`Missing screen template: ${name}`);
    return template.trimEnd();
  });
  document.body.insertAdjacentHTML('afterbegin', markup);
  const root = document.getElementById('app');
  if (!root) throw new Error('Application markup did not mount');
  return root;
}
