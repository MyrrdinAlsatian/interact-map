import { validateParserInput } from '../lib/parser-contract.js';
import { parseDockerCompose } from '../lib/docker-compose-parser.js';
import { parseDockerInspect } from '../lib/docker-inspect-parser.js';
import { parseDockerPsJson } from '../lib/docker-ps-parser.js';

/**
 * parser-island — Web Component for parsing infrastructure source formats into canonical graph contracts.
 *
 * Usage:
 *   <parser-island></parser-island>
 *
 * Public API:
 *   parse(input: { sourceType, schemaVersion, payload }) → ParserResult
 *     Returns a ParserResult. On error, errors[] is populated; no exception is thrown.
 *
 * Events dispatched:
 *   parse-success  — { detail: ParserResult }
 *   parse-error    — { detail: { errors: ContractError[], warnings: ContractError[] } }
 *
 * Supported sourceTypes: docker-compose, docker-inspect, docker-ps
 * Schema version policy: '1.0' (current), '0.9' (previous accepted with warning); older → structured error
 */
class ParserIsland extends HTMLElement {
  connectedCallback() {
    this.#renderShell();
  }

  /**
   * Parse a source input into a canonical ParserResult.
   *
   * @param {{ sourceType: string, schemaVersion: string, payload: unknown }} input
   * @returns {{ schemaVersion: string, nodes: object[], edges: object[], errors: object[], warnings: object[] }}
   */
  parse(input) {
    // Validate envelope first
    const validation = validateParserInput(input);
    if (!validation.valid) {
      const result = { schemaVersion: input?.schemaVersion ?? '', nodes: [], edges: [], errors: validation.errors, warnings: validation.warnings };
      this.dispatchEvent(new CustomEvent('parse-error', { detail: { errors: validation.errors, warnings: validation.warnings }, bubbles: true }));
      this.#renderErrors(validation.errors, validation.warnings);
      return result;
    }

    let result;
    try {
      switch (input.sourceType) {
        case 'docker-compose':
          result = parseDockerCompose(input.payload, undefined, input.schemaVersion);
          break;
        case 'docker-inspect':
          result = parseDockerInspect(input.payload, input.schemaVersion);
          break;
        case 'docker-ps':
          result = parseDockerPsJson(input.payload, input.schemaVersion);
          break;
        default:
          result = { schemaVersion: input.schemaVersion, nodes: [], edges: [],
            errors: [{ code: 'SOURCE_TYPE_UNSUPPORTED', message: `Unknown sourceType: ${input.sourceType}`, severity: 'error' }],
            warnings: [] };
      }
    } catch (err) {
      const errorEntry = { code: 'PARSE_EXCEPTION', message: String(err?.message ?? err), severity: 'error' };
      result = { schemaVersion: input.schemaVersion, nodes: [], edges: [], errors: [errorEntry], warnings: [] };
    }

    if (result.errors && result.errors.length > 0) {
      this.dispatchEvent(new CustomEvent('parse-error', { detail: { errors: result.errors, warnings: result.warnings ?? [] }, bubbles: true }));
      this.#renderErrors(result.errors, result.warnings ?? []);
    } else {
      this.dispatchEvent(new CustomEvent('parse-success', { detail: result, bubbles: true }));
      this.#renderSuccess(result);
    }

    return result;
  }

  #renderShell() {
    this.innerHTML = `
      <div class="parser-island" style="padding:12px;border:1px solid #dee2e6;border-radius:8px;background:#fff;">
        <h3 style="margin:0 0 10px;font-size:1rem;">Parser Island</h3>
        <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:4px;">Source type</label>
        <select id="sourceType" style="padding:6px 10px;border:1px solid #ced4da;border-radius:6px;margin-bottom:8px;">
          <option value="docker-compose">docker-compose (YAML)</option>
          <option value="docker-inspect">docker inspect (JSON)</option>
          <option value="docker-ps">docker ps (JSON)</option>
        </select>
        <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:4px;">Schema version</label>
        <select id="schemaVersion" style="padding:6px 10px;border:1px solid #ced4da;border-radius:6px;margin-bottom:8px;">
          <option value="1.0">1.0 (current)</option>
          <option value="0.9">0.9 (previous)</option>
          <option value="0.1">0.1 (unsupported — test error handling)</option>
        </select>
        <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:4px;">Payload</label>
        <textarea id="payload" rows="8" style="width:100%;padding:8px;border:1px solid #ced4da;border-radius:6px;font-family:monospace;font-size:.82rem;box-sizing:border-box;" placeholder="Paste docker-compose YAML or docker inspect JSON here..."></textarea>
        <button id="parseBtn" type="button" style="margin-top:8px;padding:7px 14px;background:#0b7285;color:#fff;border:none;border-radius:6px;cursor:pointer;">Parse</button>
        <pre id="parserOutput" aria-live="polite" style="margin-top:12px;padding:12px;background:#f1f3f5;border-radius:6px;font-size:.82rem;white-space:pre-wrap;"></pre>
      </div>
    `;

    this.querySelector('#parseBtn').addEventListener('click', () => {
      const sourceType = this.querySelector('#sourceType').value;
      const schemaVersion = this.querySelector('#schemaVersion').value;
      const payload = this.querySelector('#payload').value;
      this.parse({ sourceType, schemaVersion, payload });
    });
  }

  #renderSuccess(result) {
    const output = this.querySelector('#parserOutput');
    if (output) {
      output.style.borderLeft = '4px solid #2b8a3e';
      output.textContent = `✓ Parsed successfully — ${result.nodes.length} nodes, ${result.edges.length} edges\n\n${JSON.stringify(result, null, 2)}`;
    }
  }

  #renderErrors(errors, warnings) {
    const output = this.querySelector('#parserOutput');
    if (output) {
      output.style.borderLeft = '4px solid #e03131';
      const warnText = warnings?.length > 0 ? `\n\nWarnings:\n${JSON.stringify(warnings, null, 2)}` : '';
      output.textContent = `✗ Errors:\n${JSON.stringify(errors, null, 2)}${warnText}`;
    }
  }
}

customElements.define('parser-island', ParserIsland);
