import { OscilloscopeMeasurements } from '../types/circuit';

export interface SamplePoint {
  t: number;
  v: number;
}

/**
 * Calculates genuine automatic oscilloscope measurements from real sampled waveform data
 */
export function calculateOscilloscopeMeasurements(
  samples: SamplePoint[]
): OscilloscopeMeasurements {
  if (!samples || samples.length === 0) {
    return {
      vMax: 0,
      vMin: 0,
      vPp: 0,
      vAvg: 0,
      frequency: 0,
      period: 0,
      dutyCycle: 0,
    };
  }

  let max = -Infinity;
  let min = Infinity;
  let sum = 0;

  for (const p of samples) {
    if (p.v > max) max = p.v;
    if (p.v < min) min = p.v;
    sum += p.v;
  }

  const vMax = Number(max.toFixed(3));
  const vMin = Number(min.toFixed(3));
  const vPp = Number((Math.max(0, max - min)).toFixed(3));
  const vAvg = Number((sum / samples.length).toFixed(3));

  // If signal is essentially DC (ripple < 0.05V)
  if (vPp < 0.05) {
    return {
      vMax,
      vMin,
      vPp: 0,
      vAvg,
      frequency: 0,
      period: 0,
      dutyCycle: vAvg > 1.0 ? 100 : 0,
    };
  }

  // Detect frequency, period, and duty cycle via midpoint threshold crossing
  const mid = (max + min) / 2;
  const risingEdges: number[] = [];
  const fallingEdges: number[] = [];

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];

    if (prev.v < mid && curr.v >= mid) {
      // Linear interpolation for sub-step accuracy
      const frac = (mid - prev.v) / Math.max(1e-6, curr.v - prev.v);
      risingEdges.push(prev.t + frac * (curr.t - prev.t));
    } else if (prev.v >= mid && curr.v < mid) {
      const frac = (mid - prev.v) / Math.max(1e-6, curr.v - prev.v);
      fallingEdges.push(prev.t + frac * (curr.t - prev.t));
    }
  }

  let period = 0;
  let frequency = 0;
  let dutyCycle = 50;

  if (risingEdges.length >= 2) {
    let periodSum = 0;
    for (let k = 1; k < risingEdges.length; k++) {
      periodSum += risingEdges[k] - risingEdges[k - 1];
    }
    period = periodSum / (risingEdges.length - 1);
    if (period > 1e-6) {
      frequency = 1 / period;
    }

    // Duty cycle calculation: time high / period
    if (fallingEdges.length > 0 && fallingEdges[0] > risingEdges[0]) {
      const tHigh = fallingEdges[0] - risingEdges[0];
      dutyCycle = Math.min(100, Math.max(0, (tHigh / period) * 100));
    }
  }

  return {
    vMax,
    vMin,
    vPp,
    vAvg,
    frequency: Number(frequency.toFixed(1)),
    period: Number(period.toFixed(4)),
    dutyCycle: Number(dutyCycle.toFixed(1)),
  };
}
