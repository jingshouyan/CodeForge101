export const EXAMPLE_SCHEMA = JSON.stringify(
  {
    version: '1.0',
    root: {
      type: 'container',
      props: { layout: 'vertical', gap: 8 },
      children: [
        { id: 't1', type: 'text', props: { content: '你好，低代码平台' } },
        { id: 'b1', type: 'button', props: { text: '按钮' } },
      ],
    },
  },
  null,
  2,
)
