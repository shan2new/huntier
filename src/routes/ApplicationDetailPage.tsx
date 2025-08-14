import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { getApplication, listConversations, addConversation, listInterviews, scheduleInterview, patchApplication } from '../lib/api'
import { CompensationEditor } from './components/CompensationEditor'
import { QASnapshotEditor } from './components/QASnapshotEditor'
import { ConversationFeed } from './components/ConversationFeed'
import { InterviewsTimeline } from './components/InterviewsTimeline'


export function ApplicationDetailPage() {
  const { id } = useParams({ from: '/applications/$id' })
  const { getToken } = useAuth()
  const [app, setApp] = useState<any | null>(null)
  const [convs, setConvs] = useState<any[]>([])
  const [rounds, setRounds] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const token = await getToken()
      const data = await getApplication<any>(token!, id)
      setApp(data)
      const [c, r] = await Promise.all([
        listConversations<any[]>(token!, id),
        listInterviews<any[]>(token!, id),
      ])
      setConvs(c)
      setRounds(r)
    })()
  }, [id, getToken])

  if (!app) return <div>Loading…</div>
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{app.role}</h1>
          <div className="text-sm text-muted-foreground">{app.stage} • {app.source}</div>
        </div>
        <a href={app.job_url} target="_blank" className="text-sm underline">Job link</a>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <CompensationEditor app={app} onSave={async (payload: any) => {
          const token = await getToken();
          const saved = await patchApplication<any>(token!, id!, { compensation: payload })
          setApp(saved)
        }} />
        <section className="border rounded-lg p-4">
          <h2 className="font-medium mb-2">Recruiter Q&A</h2>
          <QASnapshotEditor app={app} onSave={async (payload: any) => {
            const token = await getToken();
            const saved = await patchApplication<any>(token!, id!, { qa_snapshot: payload })
            setApp(saved)
          }} />
        </section>
      </div>
      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-2">Conversation Feed</h2>
        <ConversationFeed items={convs} onAdd={async (body: any) => {
          const token = await getToken();
          const saved = await addConversation<any>(token!, id!, body)
          setConvs((prev) => [saved, ...prev])
        }} />
      </section>
      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-2">Interviews</h2>
        <InterviewsTimeline items={rounds} onSchedule={async (body: any) => {
          const token = await getToken();
          const saved = await scheduleInterview<any>(token!, id!, body)
          setRounds((prev) => [...prev, saved])
        }} />
      </section>
    </div>
  )
}


