/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {FloatingCallerIdCard} from '../../src/components/FloatingCallerIdCard';

describe('FloatingCallerIdCard', () => {
  it('renders correctly when visible', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <FloatingCallerIdCard
          callerName="John Doe"
          callerNumber="+1 (555) 123-4567"
          intervalMinutes={20}
          visible={true}
        />
      );
    });
  });

  it('renders correctly when hidden', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <FloatingCallerIdCard
          callerName="John Doe"
          callerNumber="+1 (555) 123-4567"
          intervalMinutes={20}
          visible={false}
        />
      );
    });
  });

  it('displays caller information', async () => {
    const tree = ReactTestRenderer.create(
      <FloatingCallerIdCard
        callerName="Jane Smith"
        callerNumber="+1 (555) 987-6543"
        intervalMinutes={30}
        visible={true}
      />
    );

    const json = tree.toJSON();
    expect(JSON.stringify(json)).toContain('Jane Smith');
    expect(JSON.stringify(json)).toContain('30 min');
  });

  it('handles unknown caller gracefully', async () => {
    const tree = ReactTestRenderer.create(
      <FloatingCallerIdCard
        callerName=""
        callerNumber=""
        intervalMinutes={20}
        visible={true}
      />
    );

    const json = tree.toJSON();
    expect(JSON.stringify(json)).toContain('Unknown Caller');
  });

  it('shows different interval values', async () => {
    const intervals = [5, 10, 15, 20, 30];

    for (const interval of intervals) {
      const tree = ReactTestRenderer.create(
        <FloatingCallerIdCard
          callerName="Test Caller"
          callerNumber="+1-555-0000"
          intervalMinutes={interval}
          visible={true}
        />
      );

      const json = tree.toJSON();
      expect(JSON.stringify(json)).toContain(`${interval} min`);
    }
  });

  it('updates when props change', async () => {
    let renderer: any;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <FloatingCallerIdCard
          callerName="John Doe"
          callerNumber="+1 (555) 123-4567"
          intervalMinutes={20}
          visible={true}
        />
      );
    });

    let json = renderer.toJSON();
    expect(JSON.stringify(json)).toContain('John Doe');

    await ReactTestRenderer.act(() => {
      renderer.update(
        <FloatingCallerIdCard
          callerName="Jane Smith"
          callerNumber="+1 (555) 987-6543"
          intervalMinutes={30}
          visible={true}
        />
      );
    });

    json = renderer.toJSON();
    expect(JSON.stringify(json)).toContain('Jane Smith');
    expect(JSON.stringify(json)).toContain('30 min');
  });

  it('transitions visibility smoothly', async () => {
    let renderer: any;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <FloatingCallerIdCard
          callerName="John Doe"
          callerNumber="+1 (555) 123-4567"
          intervalMinutes={20}
          visible={true}
        />
      );
    });

    expect(renderer.toJSON()).not.toBeNull();

    await ReactTestRenderer.act(() => {
      renderer.update(
        <FloatingCallerIdCard
          callerName="John Doe"
          callerNumber="+1 (555) 123-4567"
          intervalMinutes={20}
          visible={false}
        />
      );
    });
  });
});
