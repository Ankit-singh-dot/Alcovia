

import { HLCTimestamp } from '../types';

export class HLC {
  private wallTime: number;
  private counter: number;
  private nodeId: string;

  constructor(nodeId: string) {
    this.wallTime = 0;
    this.counter = 0;
    this.nodeId = nodeId;
  }

  /**
   * Generate a new HLC timestamp for a LOCAL event.
   * Called whenever this device creates an operation.
   */
  now(): HLCTimestamp {
    const physicalTime = Date.now();

    if (physicalTime > this.wallTime) {
      // Physical clock advanced — use it, reset counter
      this.wallTime = physicalTime;
      this.counter = 0;
    } else {
      // Physical clock hasn't advanced (same ms or went backward)
      // Increment counter to maintain monotonicity
      this.counter++;
    }

    return {
      wallTime: this.wallTime,
      counter: this.counter,
      nodeId: this.nodeId,
    };
  }

  /**
   * Update the local HLC after receiving a REMOTE timestamp.
   * Called when we receive operations from the server during sync.
   *
   * This is the key merge operation that keeps HLCs consistent
   * across devices without clock synchronization.
   */
  receive(remote: HLCTimestamp): void {
    const physicalTime = Date.now();

    if (physicalTime > this.wallTime && physicalTime > remote.wallTime) {
      // Physical clock is ahead of both — use it
      this.wallTime = physicalTime;
      this.counter = 0;
    } else if (this.wallTime === remote.wallTime) {
      // Same wall time — take the higher counter and increment
      this.counter = Math.max(this.counter, remote.counter) + 1;
    } else if (this.wallTime > remote.wallTime) {
      // Our wall time is higher — just increment our counter
      this.counter++;
    } else {
      // Remote wall time is higher — adopt it
      this.wallTime = remote.wallTime;
      this.counter = remote.counter + 1;
    }
  }

  /**
   * Compare two HLC timestamps.
   * Returns: -1 if a < b, 0 if equal, 1 if a > b
   *
   * This is the comparison used for conflict resolution:
   * "higher HLC wins" means the operation with the greater
   * HLC timestamp takes precedence.
   */
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.wallTime !== b.wallTime) {
      return a.wallTime < b.wallTime ? -1 : 1;
    }
    if (a.counter !== b.counter) {
      return a.counter < b.counter ? -1 : 1;
    }
    // Final tiebreaker: nodeId (deterministic, not meaningful)
    if (a.nodeId < b.nodeId) return -1;
    if (a.nodeId > b.nodeId) return 1;
    return 0;
  }

  /** Get the current HLC state (for persistence) */
  getState(): HLCTimestamp {
    return {
      wallTime: this.wallTime,
      counter: this.counter,
      nodeId: this.nodeId,
    };
  }

  /** Restore HLC state (after app restart) */
  setState(state: HLCTimestamp): void {
    this.wallTime = state.wallTime;
    this.counter = state.counter;
  }
}
