import './components/button';
import './components/top-bar';
import './components/progress-bar';
import './components/poster-card';
import './components/streamer-tile';
import './components/modal';
import { html, render } from 'lit-html';

const demo = () => html`
  <div class="screen">
    <h2>Design system</h2>
    <p class="muted">Tokens + web components</p>
    <section style="margin:16px 0;display:grid;gap:12px;">
      <mc-top-bar title="Preview" show-back show-settings></mc-top-bar>
      <mc-button label="Primary"></mc-button>
      <mc-button variant="ghost" label="Ghost"></mc-button>
      <mc-progress-bar value="0.42"></mc-progress-bar>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <mc-poster-card
          title="Sample Show"
          image="https://placehold.co/400x600/141414/E50914/png?text=2%3A3"
        ></mc-poster-card>
        <mc-streamer-tile name="Netflix" selected></mc-streamer-tile>
        <mc-streamer-tile name="Showmax"></mc-streamer-tile>
      </div>
      <mc-modal id="demo-modal" title="Example" open>
        <p class="muted">Modal body via slot.</p>
      </mc-modal>
    </section>
  </div>
`;

render(demo(), document.getElementById('demo')!);
