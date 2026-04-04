import { config } from '~/config/app.config'
import resend from './resendClient'

type Params = {
  from?: string
  to: string | string[]
  subject: string
  text: string
  html: string
}

const mailer_sender =
  config.NODE_ENV === 'development'
    ? `no-reply <onboarding@resend.dev>`
    : `no-reply <${config.MAILER_SENDER}>`

export const sendEmail = async ({
  html,
  subject,
  text,
  to,
  from = mailer_sender
}: Params) => {
  return await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html
  })
}
