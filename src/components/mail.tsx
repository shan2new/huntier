import * as React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { AccountSwitcher } from "./account-switcher"
import { MailDisplay } from "./mail-display"
import { MailList } from "./mail-list"
import { Nav } from "./nav"
import type { Account } from "./account-switcher"
import type { Mail } from "./mail-list"

interface MailProps {
  accounts: Array<Account>
  mails: Array<Mail>
  defaultLayout?: Array<number>
  defaultCollapsed?: boolean
  navCollapsedSize?: number
}

export function Mail({
  accounts,
  mails,
  defaultLayout = [20, 40, 40],
  defaultCollapsed = false,
  navCollapsedSize = 4,
}: MailProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<Account>(
    accounts[0]
  )
  const [selectedMail, setSelectedMail] = React.useState<Mail>()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleMailSelect = (mail: Mail) => {
    setSelectedMail(mail)
    if (isMobile) {
      // On mobile, we might want to show only the mail display
      // This could be handled by the parent component
    }
  }

  const handleMailStar = (mailId: string, starred: boolean) => {
    // Update the mail in the list
    const updatedMails = mails.map((mail) =>
      mail.id === mailId ? { ...mail, starred } : mail
    )
    // In a real app, you'd call an API here
    console.log("Star mail:", mailId, starred)
  }

  const handleMailArchive = (mailId: string) => {
    // Archive the mail
    console.log("Archive mail:", mailId)
  }

  const handleMailDelete = (mailId: string) => {
    // Delete the mail
    console.log("Delete mail:", mailId)
  }

  const handleBack = () => {
    setSelectedMail(undefined)
  }

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile Header */}
        <div className="border-b p-4">
          <AccountSwitcher
            accounts={accounts}
            selectedAccount={selectedAccount}
            onAccountSelect={setSelectedAccount}
          />
        </div>

        {/* Mobile Content */}
        {selectedMail ? (
          <MailDisplay mail={selectedMail} onBack={handleBack} />
        ) : (
          <MailList
            mails={mails}
            selectedMailId={selectedMail?.id}
            onMailSelect={handleMailSelect}
            onMailStar={handleMailStar}
            onMailArchive={handleMailArchive}
            onMailDelete={handleMailDelete}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <PanelGroup direction="horizontal" onLayout={(sizes) => console.log(sizes)}>
        {/* Navigation Panel */}
        <Panel
          defaultSize={defaultLayout[0]}
          collapsible={true}
          collapsedSize={navCollapsedSize}
          minSize={15}
          maxSize={20}
        >
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <AccountSwitcher
                accounts={accounts}
                selectedAccount={selectedAccount}
                onAccountSelect={setSelectedAccount}
              />
            </div>
            <Nav />
          </div>
        </Panel>

        <PanelResizeHandle withHandle />

        {/* Mail List Panel */}
        <Panel defaultSize={defaultLayout[1]} minSize={30}>
          <MailList
            mails={mails}
            selectedMailId={selectedMail?.id}
            onMailSelect={handleMailSelect}
            onMailStar={handleMailStar}
            onMailArchive={handleMailArchive}
            onMailDelete={handleMailDelete}
          />
        </Panel>

        <PanelResizeHandle withHandle />

        {/* Mail Display Panel */}
        <Panel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay mail={selectedMail} onBack={handleBack} />
        </Panel>
      </PanelGroup>
    </div>
  )
}
