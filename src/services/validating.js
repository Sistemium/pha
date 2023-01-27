const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;


export function assertEmail(ctx, email) {
  ctx.assert(EMAIL_RE.test(email), 400, 'Invalid email');
  return email.toLowerCase();
}
