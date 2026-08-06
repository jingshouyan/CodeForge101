export const EXAMPLE_SCHEMA = JSON.stringify(
  {
    version: '1.0',
    root: {
      id: 'root',
      type: 'container',
      props: {
        layout: { kind: 'literal', value: 'vertical' },
        gap: { kind: 'literal', value: 8 },
      },
      children: [
        { id: 't1', type: 'text', props: { content: { kind: 'literal', value: '你好，低代码平台' } } },
        { id: 'b1', type: 'button', props: { text: { kind: 'literal', value: '按钮' } } },
      ],
    },
  },
  null,
  2,
)
