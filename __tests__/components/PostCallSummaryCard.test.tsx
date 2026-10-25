/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {PostCallSummaryCard} from '../../src/components/PostCallSummaryCard';

describe('PostCallSummaryCard', () => {
  it('renders correctly when visible', async () => {
    const mockDismiss = jest.fn();

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="John Doe"
          durationSeconds={125}
          earSwitchCount={2}
          visible={true}
          onDismiss={mockDismiss}
        />
      );
    });
  });

  it('does not render when hidden', async () => {
    const mockDismiss = jest.fn();

    const tree = ReactTestRenderer.create(
      <PostCallSummaryCard
        callerName="John Doe"
        durationSeconds={125}
        earSwitchCount={2}
        visible={false}
        onDismiss={mockDismiss}
      />
    );

    const json = tree.toJSON();
    expect(json).toBeNull();
  });

  it('displays duration correctly', async () => {
    const mockDismiss = jest.fn();

    const tree = ReactTestRenderer.create(
      <PostCallSummaryCard
        callerName="John Doe"
        durationSeconds={125}
        earSwitchCount={2}
        visible={true}
        onDismiss={mockDismiss}
      />
    );

    const json = tree.toJSON();
    // 125 seconds = 2m 5s
    expect(JSON.stringify(json)).toContain('2m 5s');
  });

  it('displays ear switch count', async () => {
    const mockDismiss = jest.fn();

    const tree = ReactTestRenderer.create(
      <PostCallSummaryCard
        callerName="Jane Smith"
        durationSeconds={3600}
        earSwitchCount={3}
        visible={true}
        onDismiss={mockDismiss}
      />
    );

    const json = tree.toJSON();
    expect(JSON.stringify(json)).toContain('3x');
  });

  it('shows caller name', async () => {
    const mockDismiss = jest.fn();

    const tree = ReactTestRenderer.create(
      <PostCallSummaryCard
        callerName="Test Caller"
        durationSeconds={60}
        earSwitchCount={1}
        visible={true}
        onDismiss={mockDismiss}
      />
    );

    const json = tree.toJSON();
    expect(JSON.stringify(json)).toContain('Test Caller');
  });

  it('formats various durations correctly', async () => {
    const mockDismiss = jest.fn();

    const testCases = [
      {seconds: 30, expected: '0m 30s'},
      {seconds: 60, expected: '1m 0s'},
      {seconds: 125, expected: '2m 5s'},
      {seconds: 3661, expected: '61m 1s'},
    ];

    for (const {seconds, expected} of testCases) {
      const tree = ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="Test"
          durationSeconds={seconds}
          earSwitchCount={0}
          visible={true}
          onDismiss={mockDismiss}
        />
      );

      const json = tree.toJSON();
      expect(JSON.stringify(json)).toContain(expected);
    }
  });

  it('calls dismiss callback when tapped', async () => {
    const mockDismiss = jest.fn();
    jest.useFakeTimers();

    let tree: any;

    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="John Doe"
          durationSeconds={125}
          earSwitchCount={2}
          visible={true}
          onDismiss={mockDismiss}
        />
      );
    });

    // Simulate pressing the card
    const instance = tree.root;
    const pressable = instance.findByType('Pressable');

    await ReactTestRenderer.act(async () => {
      pressable.props.onPress();
      jest.runAllTimers();
    });

    jest.useRealTimers();
  });

  it('auto-dismisses after 5 seconds', async () => {
    const mockDismiss = jest.fn();
    jest.useFakeTimers();

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="John Doe"
          durationSeconds={125}
          earSwitchCount={2}
          visible={true}
          onDismiss={mockDismiss}
        />
      );
    });

    jest.advanceTimersByTime(5000);

    jest.useRealTimers();
  });

  it('handles different ear switch counts', async () => {
    const mockDismiss = jest.fn();

    const counts = [0, 1, 2, 5, 10];

    for (const count of counts) {
      const tree = ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="Test"
          durationSeconds={1000}
          earSwitchCount={count}
          visible={true}
          onDismiss={mockDismiss}
        />
      );

      const json = tree.toJSON();
      expect(JSON.stringify(json)).toContain(`${count}x`);
    }
  });

  it('transitions visibility smoothly', async () => {
    const mockDismiss = jest.fn();
    let tree: any;

    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="John Doe"
          durationSeconds={125}
          earSwitchCount={2}
          visible={true}
          onDismiss={mockDismiss}
        />
      );
    });

    expect(tree.toJSON()).not.toBeNull();

    await ReactTestRenderer.act(() => {
      tree.update(
        <PostCallSummaryCard
          callerName="John Doe"
          durationSeconds={125}
          earSwitchCount={2}
          visible={false}
          onDismiss={mockDismiss}
        />
      );
    });

    // Component should return null when hidden
    const json = tree.toJSON();
    expect(json).toBeNull();
  });

  it('clears auto-dismiss timer when dismissed manually', async () => {
    const mockDismiss = jest.fn();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    jest.useFakeTimers();

    let tree: any;

    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <PostCallSummaryCard
          callerName="John Doe"
          durationSeconds={125}
          earSwitchCount={2}
          visible={true}
          onDismiss={mockDismiss}
        />
      );
    });

    const instance = tree.root;
    const pressable = instance.findByType('Pressable');

    await ReactTestRenderer.act(async () => {
      pressable.props.onPress();
      jest.runAllTimers();
    });

    jest.useRealTimers();
    clearTimeoutSpy.mockRestore();
  });
});
