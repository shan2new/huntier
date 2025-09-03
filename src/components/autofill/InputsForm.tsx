import { useCallback, useState } from 'react'
import { Award, Briefcase, DollarSign, Github, Globe, Linkedin, Mail, MessageSquare, Phone, Plus, User, X } from 'lucide-react'
import type { AutofillInputs, CustomField, CustomFieldType } from '@/types/autofill'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export interface InputsFormProps {
  value: AutofillInputs
  onChange: (value: AutofillInputs) => void
}

function update<T>(value: T, patch: Partial<T>): T {
  return { ...(value as any), ...(patch as any) }
}

function genId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

export function InputsForm({ value, onChange }: InputsFormProps) {
  const [essentialsOnly, setEssentialsOnly] = useState(false)
  const setField = useCallback(<TKey extends keyof AutofillInputs>(key: TKey, v: AutofillInputs[TKey]) => {
    onChange(update(value, { [key]: v } as Partial<AutofillInputs>))
  }, [value, onChange])

  const addCustomField = useCallback(() => {
    const newField: CustomField = { id: genId(), label: 'Custom', type: 'text', value: '' }
    onChange(update(value, { customFields: [...value.customFields, newField] }))
  }, [value, onChange])

  const updateCustomField = useCallback((id: string, patch: Partial<CustomField>) => {
    const next = value.customFields.map((f) => f.id === id ? { ...f, ...patch } : f)
    onChange(update(value, { customFields: next }))
  }, [value, onChange])

  const removeCustomField = useCallback((id: string) => {
    onChange(update(value, { customFields: value.customFields.filter((f) => f.id !== id) }))
  }, [value, onChange])

  return (
    <div className="space-y-8">
      {/* Toggle */}
      <div className="flex items-center justify-between p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm">
        <div>
          <h3 className="font-semibold mb-1">View Mode</h3>
          <p className="text-sm text-muted-foreground">Show only essential fields or all available options</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="essentialsOnly" className="text-sm font-medium">
            {essentialsOnly ? 'Essentials Only' : 'All Fields'}
          </Label>
          <Switch checked={essentialsOnly} onCheckedChange={(v) => setEssentialsOnly(!!v)} id="essentialsOnly" />
        </div>
      </div>

      {/* Identity & Links */}
      <section className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Identity & Links</h2>
              <p className="text-sm text-muted-foreground mt-1">Your basic contact information and professional profiles</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full name *
              </Label>
              <Input 
                id="fullName" 
                value={value.fullName} 
                onChange={(e) => setField('fullName', e.target.value)} 
                placeholder="Jane Doe" 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email *
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={value.email} 
                onChange={(e) => setField('email', e.target.value)} 
                placeholder="jane@doe.com" 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone
              </Label>
              <Input 
                id="phone" 
                value={value.phone} 
                onChange={(e) => setField('phone', e.target.value)} 
                placeholder="+1 555-555-5555" 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                LinkedIn
              </Label>
              <Input 
                id="linkedinUrl" 
                value={value.linkedinUrl} 
                onChange={(e) => setField('linkedinUrl', e.target.value)} 
                placeholder="https://linkedin.com/in/..." 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
            </div>
            {!essentialsOnly && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Location
                  </Label>
                  <Input 
                    id="location" 
                    value={value.location} 
                    onChange={(e) => setField('location', e.target.value)} 
                    placeholder="City, Country" 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl" className="text-sm font-medium flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    GitHub
                  </Label>
                  <Input 
                    id="githubUrl" 
                    value={value.githubUrl} 
                    onChange={(e) => setField('githubUrl', e.target.value)} 
                    placeholder="https://github.com/..." 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label htmlFor="portfolioUrl" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Portfolio
                  </Label>
                  <Input 
                    id="portfolioUrl" 
                    value={value.portfolioUrl} 
                    onChange={(e) => setField('portfolioUrl', e.target.value)} 
                    placeholder="https://..." 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Role & Experience */}
      <section className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Role & Experience</h2>
              <p className="text-sm text-muted-foreground mt-1">Your professional background and expertise</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="desiredRole" className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Desired role *
              </Label>
              <Input 
                id="desiredRole" 
                value={value.desiredRole} 
                onChange={(e) => setField('desiredRole', e.target.value)} 
                placeholder="Senior Frontend Engineer" 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience" className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                Years of experience
              </Label>
              <Input 
                id="yearsOfExperience" 
                value={value.yearsOfExperience} 
                onChange={(e) => setField('yearsOfExperience', e.target.value)} 
                placeholder="5" 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
            </div>
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="primarySkills" className="text-sm font-medium">Primary skills</Label>
              <Input 
                id="primarySkills" 
                value={value.primarySkills} 
                onChange={(e) => setField('primarySkills', e.target.value)} 
                placeholder="React, TypeScript, Node.js" 
                className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of your key technical skills</p>
            </div>
          </div>
        </div>
      </section>

      {!essentialsOnly && (
        <>
          {/* Availability & Compensation */}
          <section className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg" />
                <div>
                  <h2 className="text-xl font-semibold">Availability & Compensation</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your availability and salary expectations</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod" className="text-sm font-medium flex items-center gap-2">
                    Notice period
                  </Label>
                  <Input 
                    id="noticePeriod" 
                    value={value.noticePeriod} 
                    onChange={(e) => setField('noticePeriod', e.target.value)} 
                    placeholder="30 days" 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workAuthorization" className="text-sm font-medium">Work authorization</Label>
                  <Input 
                    id="workAuthorization" 
                    value={value.workAuthorization} 
                    onChange={(e) => setField('workAuthorization', e.target.value)} 
                    placeholder="US Citizen / H1B / OPT ..." 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentCompensation" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Current compensation
                  </Label>
                  <Input 
                    id="currentCompensation" 
                    value={value.currentCompensation} 
                    onChange={(e) => setField('currentCompensation', e.target.value)} 
                    placeholder="$120k + bonus" 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCompensation" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Expected compensation
                  </Label>
                  <Input 
                    id="expectedCompensation" 
                    value={value.expectedCompensation} 
                    onChange={(e) => setField('expectedCompensation', e.target.value)} 
                    placeholder="$150k+" 
                    className="h-12 border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring]" 
                  />
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg">
                  <Switch checked={value.willingToRelocate} onCheckedChange={(v) => setField('willingToRelocate', !!v)} id="willingToRelocate" />
                  <Label htmlFor="willingToRelocate" className="text-sm font-medium">Willing to relocate</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Work preference</Label>
                  <Select value={value.remotePreference || 'none'} onValueChange={(v) => setField('remotePreference', (v === 'none' ? '' : v) as any)}>
                    <SelectTrigger className="h-12 border-border bg-muted/20 text-foreground focus:border-primary">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No preference</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Screening Questions */}
          <section className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Screening Questions</h2>
                  <p className="text-sm text-muted-foreground mt-1">Common questions recruiters ask</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reasonForChange" className="text-sm font-medium">Reason for change</Label>
                <Textarea 
                  id="reasonForChange" 
                  value={value.reasonForChange} 
                  onChange={(e) => setField('reasonForChange', e.target.value)} 
                  rows={4} 
                  placeholder="Brief reason for job change" 
                  className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] resize-none" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastLeavingReasons" className="text-sm font-medium">Past leaving reasons</Label>
                <Textarea 
                  id="pastLeavingReasons" 
                  value={value.pastLeavingReasons} 
                  onChange={(e) => setField('pastLeavingReasons', e.target.value)} 
                  rows={4} 
                  placeholder="Why you left previous roles" 
                  className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] resize-none" 
                />
              </div>
            </div>
          </section>

          {/* Custom Fields */}
          <section className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Custom Fields</h2>
                    <p className="text-sm text-muted-foreground mt-1">Add any additional information you need</p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={addCustomField} 
                  variant="outline" 
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10 dark:bg-primary/50 dark:text-primary-foreground dark:hover:bg-primary/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </div>
            <div className="p-6">
              {value.customFields.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-3 bg-muted/10 rounded-full w-fit mx-auto mb-3">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No custom fields added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Field" to create custom inputs for specific requirements</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {value.customFields.map((f) => (
                    <div key={f.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-muted/40 rounded-lg">
                      <div className="lg:col-span-4 space-y-2">
                        <Label className="text-sm font-medium">Label</Label>
                        <Input 
                          value={f.label} 
                          onChange={(e) => updateCustomField(f.id, { label: e.target.value })} 
                          className="h-10 border-border bg-muted/20 text-foreground focus:border-primary" 
                        />
                      </div>
                      <div className="lg:col-span-3 space-y-2">
                        <Label className="text-sm font-medium">Type</Label>
                        <Select value={f.type} onValueChange={(v) => updateCustomField(f.id, { type: v as CustomFieldType })}>
                          <SelectTrigger className="h-10 border-border bg-muted/20 text-foreground focus:border-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="lg:col-span-4 space-y-2">
                        <Label className="text-sm font-medium">Value</Label>
                        {f.type === 'textarea' ? (
                          <Textarea 
                            value={f.value} 
                            onChange={(e) => updateCustomField(f.id, { value: e.target.value })} 
                            rows={3} 
                            className="border-border bg-muted/20 text-foreground focus:border-primary resize-none" 
                          />
                        ) : (
                          <Input 
                            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'} 
                            value={f.value} 
                            onChange={(e) => updateCustomField(f.id, { value: e.target.value })} 
                            className="h-10 border-border bg-muted/20 text-foreground focus:border-primary" 
                          />
                        )}
                      </div>
                      <div className="lg:col-span-1 flex items-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeCustomField(f.id)}
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:text-muted-foreground dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default InputsForm