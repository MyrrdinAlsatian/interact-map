import { Graph } from 'https://cdn.jsdelivr.net/npm/@antv/x6@2.18.1/+esm';
import { validateGraphModel } from '../lib/graph-model.js';
import { toX6Graph, getCriticalityColor } from '../lib/x6-adapter.js';
import { analyzeIncidentImpact } from '../lib/incident-impact.js';

class ArchitectureGraph extends HTMLElement {
  #graph;
  #graphModel = { nodes: [], edges: [] };
  #container;

  connectedCallback() {
    this.#renderShell();
    this.#mountX6();
  }

  set data(graphModel) {
    validateGraphModel(graphModel);
    this.#graphModel = graphModel;
    this.#renderGraph();
  }

  loadGraph(graphModel) {
    this.data = graphModel;
  }

  focusNode(nodeId) {
    if (!this.#graph) {
      return;
    }
    const node = this.#graph.getCellById(nodeId);
    if (!node) {
      return;
    }
    this.#graph.centerCell(node);
    this.#graph.select(node);
  }

  highlightDependencies(nodeId) {
    if (!this.#graph) {
      return;
    }

    this.#graph.getEdges().forEach((edge) => {
      const source = edge.getSourceCellId();
      const target = edge.getTargetCellId();
      const isRelated = source === nodeId || target === nodeId;
      const criticality = edge.getData()?.criticality || 'low';
      edge.attr('line/strokeWidth', isRelated ? 4 : 1);
      edge.attr('line/stroke', isRelated ? getCriticalityColor(criticality) : '#adb5bd');
    });
  }

  simulateIncident(nodeId, mode = 'bfs') {
    const result = analyzeIncidentImpact(this.#graphModel, nodeId, mode);

    this.#graph.getNodes().forEach((node) => {
      if (node.id === nodeId) {
        node.attr('body/stroke', '#e03131');
        node.attr('body/strokeWidth', 4);
      } else if (result.impactedNodes.includes(node.id)) {
        node.attr('body/stroke', '#f08c00');
        node.attr('body/strokeWidth', 3);
      } else {
        node.attr('body/strokeWidth', 2);
      }
    });

    this.#graph.getEdges().forEach((edge) => {
      const impacted = result.impactedEdges.includes(edge.id);
      edge.attr('line/strokeWidth', impacted ? 4 : 1);
      if (!impacted) {
        edge.attr('line/stroke', '#adb5bd');
      }
    });

    this.dispatchEvent(
      new CustomEvent('incident-simulated', {
        detail: result,
        bubbles: true,
      })
    );

    return result;
  }

  #renderShell() {
    this.style.display = 'block';
    this.style.minHeight = this.getAttribute('height') || '520px';
    this.innerHTML = '<div part="canvas" style="width:100%;height:100%;border:1px solid #dee2e6;border-radius:12px"></div>';
    this.#container = this.querySelector('div');
  }

  #mountX6() {
    this.#graph = new Graph({
      container: this.#container,
      panning: true,
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        minScale: 0.2,
        maxScale: 3,
      },
      selecting: {
        enabled: true,
        multiple: false,
      },
      grid: {
        visible: true,
      },
    });
  }

  #renderGraph() {
    if (!this.#graph) {
      return;
    }
    const x6Graph = toX6Graph(this.#graphModel);
    this.#graph.clearCells();
    this.#graph.fromJSON(x6Graph);
    this.#graph.centerContent();
  }
}

customElements.define('architecture-graph', ArchitectureGraph);
