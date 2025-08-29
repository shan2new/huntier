import { Mail } from "@/routes/components/shadcn-mail/components/mail"
import { accounts, mails } from "@/routes/components/shadcn-mail/data"

export function MailPage() {

  const defaultLayout = [30, 70]

  return (
    <>
      <div className="hidden flex-col md:flex pr-4 pl-2">
        <Mail
          accounts={accounts}
          mails={mails}
          defaultLayout={defaultLayout}
          navCollapsedSize={4}
        />
      </div>
    </>
  )
}