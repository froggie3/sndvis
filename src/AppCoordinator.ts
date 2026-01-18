export class AppCoordinator {
    private appContainer: HTMLElement;
    private sourceContainer: HTMLElement;
    private currentSource: any = null; // using any to avoid type complexity in this simplifed snippets, strictly should be IAudioSource
    private onSourceChange: (source: any) => void;

    constructor(
        containerId: string,
        onSourceChange: (source: any) => void
    ) {
        this.appContainer = document.getElementById(containerId) as HTMLElement;
        this.onSourceChange = onSourceChange;

        // Create UI area
        const uiLayer = document.createElement('div');
        uiLayer.style.position = 'absolute';
        uiLayer.style.bottom = '20px';
        uiLayer.style.left = '20px';
        uiLayer.style.zIndex = '100';
        uiLayer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        uiLayer.style.padding = '10px';
        uiLayer.style.borderRadius = '8px';
        uiLayer.style.display = 'flex';
        uiLayer.style.flexDirection = 'column';
        uiLayer.style.gap = '10px';

        this.appContainer.appendChild(uiLayer);

        // 1. Source Selector
        const selectorRow = document.createElement('div');
        const label = document.createElement('span');
        label.innerText = "Source: ";
        label.style.color = "#eee";
        label.style.marginRight = "10px";

        const select = document.createElement('select');
        select.innerHTML = `
            <option value="test">Test Signal (Sine)</option>
            <option value="mic">Microphone</option>
            <option value="file">File Player</option>
        `;
        select.addEventListener('change', (e) => this.handleSourceChange((e.target as HTMLSelectElement).value));

        selectorRow.appendChild(label);
        selectorRow.appendChild(select);
        uiLayer.appendChild(selectorRow);

        // 2. Dynamic Source UI Container
        this.sourceContainer = document.createElement('div');
        uiLayer.appendChild(this.sourceContainer);
    }

    public async handleSourceChange(type: string) {
        // Cleanup old
        if (this.currentSource) {
            this.currentSource.disconnect();
            this.sourceContainer.innerHTML = '';
        }

        // Dynamically import to split code? Or just use static imports for now.
        // For simplicity, we assume classes are available globally or passed in. 
        // We will notify Main to instantiate.

        this.onSourceChange(type);
    }

    public updateSourceUI(source: any, onExportRequest?: () => void) {
        this.currentSource = source;
        const ui = source.getUIComponent();

        // Clear previous source UI
        this.sourceContainer.innerHTML = '';

        if (ui) {
            this.sourceContainer.appendChild(ui);
        }

        // Check availability of export
        // Duck typing check for FileAudioSource
        if (source.loadFile && onExportRequest) {
            const btn = document.createElement('button');
            btn.innerText = "Render Video (.webm)";
            btn.style.marginTop = "10px";
            btn.addEventListener('click', onExportRequest);
            this.sourceContainer.appendChild(btn);
        }
    }
}
