import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-server',
    configureServer(server) {
      server.middlewares.use('/api/gemini/assistant', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const parsed = JSON.parse(body || '{}');
            const { prompt, circuitContext } = parsed;

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                reply: "I am CirKit Engineering Assistant. Note: GEMINI_API_KEY is not configured in this environment, but you can inspect calculated nodal voltages, current, and component diagnostics directly in the simulation panel below."
              }));
              return;
            }

            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            const systemInstruction = `You are CirKit AI, a senior electrical engineering laboratory tutor assisting students with circuit simulation and design.
You receive structured circuit data: components, values, connections, and calculated simulation results.
Analyze the circuit using fundamental electrical laws (Ohm's Law V=IR, Kirchhoff's Laws KVL/KCL, diode forward drops ~0.7V for silicon and ~2.0V for red LEDs, capacitor time constant tau = RC, power P=VI).
Format your answers clearly:
- State Calculated Results (exact numbers with units)
- Cite Engineering Rules / Laws
- Provide Concrete Suggestions or Fixes
- Clearly note any uncertain diagnosis or missing nodes (like missing ground).
Keep responses helpful, concise, well-formatted, and educational.`;

            const fullPrompt = `Circuit Context:
${JSON.stringify(circuitContext, null, 2)}

Student Question:
${prompt}`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: fullPrompt,
              config: {
                systemInstruction,
                temperature: 0.3,
              },
            });

            res.statusCode = 200;
            res.end(JSON.stringify({ reply: response.text }));
          } catch (err: any) {
            console.error('Gemini API Error:', err);
            // If quota exhausted or rate limit hit, return graceful 200 with notice so client can use offline physics tutor
            res.statusCode = 200;
            res.end(JSON.stringify({
              reply: null,
              fallback: true,
              error: err.message || 'API quota reached. Using offline engineering tutor engine.'
            }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

