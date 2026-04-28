'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Building, MapPin, Calendar, Clock, Cloud, Camera, CheckCircle, XCircle, List, Eye, Trash2, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const elementTypes = [
  { id: 'semelle_isolee', label: 'Semelle isolée' },
  { id: 'semelle_filante', label: 'Semelle filante' },
  { id: 'poteau', label: 'Poteau' },
  { id: 'poutre', label: 'Poutre' },
  { id: 'muret', label: 'Muret' },
  { id: 'dalle_pleine', label: 'Dalle pleine' },
  { id: 'voile', label: 'Voile' },
  { id: 'escalier', label: 'Escalier' },
  { id: 'autre', label: 'Autre' }
]

const verificationCriteria = [
  'Conformité des barres (diamètre, nuance)',
  'Espacement des aciers',
  'Enrobage',
  'Longueur d\'ancrage et recouvrements',
  'Dispositions constructives',
  'État des surfaces (absence de rouille)',
  'Liaison entre éléments',
  'Supportage et fixation'
]

const followUpActions = [
  'Accepté sans réserve',
  'Accepté sous réserve de levée des réserves',
  'À corriger avant coulage',
  'Refusé – A reprendre'
]

const signatureRoles = [
  'ENTREPRISE',
  'MAÎTRE D\'ŒUVRE / BET',
  'MAÎTRE D\'OUVRAGE',
  'BUREAU DE CONTRÔLE (si applicable)'
]

export default function ReceptionFerraillePage() {
  const [showFormsList, setShowFormsList] = useState(false)
  const [formsList, setFormsList] = useState<any[]>([])
  const [viewingForm, setViewingForm] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [formData, setFormData] = useState({
    ficheNumber: '',
    project: '',
    company: '',
    client: '',
    bureauEtude: '',
    block: '',
    level: '',
    location: '',
    receptionDate: '',
    receptionTime: '',
    weather: '',
    elementType: '',
    referencePlans: '',
    borderau: '',
    specifications: '',
    planNumber: '',
    planIndex: '',
    observations: '',
    followUpAction: '',
    reservationDeadline: '',
    reservationResponsible: ''
  })

  const [verifications, setVerifications] = useState(
    verificationCriteria.map(criteria => ({
      criteria,
      isCompliant: false,
      isNonCompliant: false,
      isNotApplicable: false,
      observations: ''
    }))
  )

  const [photos, setPhotos] = useState<string[]>([])
  const [signatures, setSignatures] = useState(
    signatureRoles.map(role => ({
      role,
      name: '',
      function: '',
      date: '',
      time: ''
    }))
  )

  const [activeTab, setActiveTab] = useState('general')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVerificationChange = (index: number, field: string, value: boolean) => {
    const newVerifications = [...verifications]
    if (field === 'isCompliant') {
      newVerifications[index].isCompliant = value
      newVerifications[index].isNonCompliant = false
      newVerifications[index].isNotApplicable = false
    } else if (field === 'isNonCompliant') {
      newVerifications[index].isNonCompliant = value
      newVerifications[index].isCompliant = false
      newVerifications[index].isNotApplicable = false
    } else if (field === 'isNotApplicable') {
      newVerifications[index].isNotApplicable = value
      newVerifications[index].isCompliant = false
      newVerifications[index].isNonCompliant = false
    }
    setVerifications(newVerifications)
  }

  const handleVerificationObservation = (index: number, value: string) => {
    const newVerifications = [...verifications]
    newVerifications[index].observations = value
    setVerifications(newVerifications)
  }

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newPhotos = [...photos]
        newPhotos[index] = reader.result as string
        setPhotos(newPhotos)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignatureChange = (index: number, field: string, value: string) => {
    const newSignatures = [...signatures]
    newSignatures[index] = { ...newSignatures[index], [field]: value }
    setSignatures(newSignatures)
  }

  const handleSubmit = async () => {
    if (!formData.ficheNumber) {
      toast.error('Veuillez remplir le numéro de fiche')
      return
    }

    try {
      const fullFormData = {
        ...formData,
        verifications,
        photos,
        signatures
      }

      const response = await fetch('/api/reception-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullFormData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Formulaire soumis avec succès!')
        setFormData({
          ficheNumber: '',
          project: '',
          company: '',
          client: '',
          bureauEtude: '',
          block: '',
          level: '',
          location: '',
          receptionDate: '',
          receptionTime: '',
          weather: '',
          elementType: '',
          referencePlans: '',
          borderau: '',
          specifications: '',
          planNumber: '',
          planIndex: '',
          observations: '',
          followUpAction: '',
          reservationDeadline: '',
          reservationResponsible: ''
        })
        setVerifications(verificationCriteria.map(criteria => ({
          criteria,
          isCompliant: false,
          isNonCompliant: false,
          isNotApplicable: false,
          observations: ''
        })))
        setPhotos([])
        setSignatures(signatureRoles.map(role => ({
          role,
          name: '',
          function: '',
          date: '',
          time: ''
        })))
      } else {
        toast.error(result.error || 'Erreur lors de la soumission')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Erreur lors de la soumission du formulaire')
    }
  }

  const generateFicheNumber = () => {
    if (typeof window === 'undefined') return

    const date = new Date()
    const num = `FR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    handleInputChange('ficheNumber', num)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-lg shadow-lg shadow-orange-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Fichier de Réception Ferraillages
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Contrôle Qualité
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showFormsList} onOpenChange={setShowFormsList}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="default">
                    <List className="w-4 h-4 mr-2" />
                    Mes Formulaires
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Mes Formulaires de Réception</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {formsList.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">
                          Aucun formulaire trouvé
                        </p>
                      ) : (
                        formsList.map((form) => (
                          <Card key={form.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge>{form.ficheNumber}</Badge>
                                </div>
                                <h3 className="font-semibold">{form.project || 'Sans nom'}</h3>
                                <p className="text-sm text-slate-600">{form.company || 'Sans entreprise'}</p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {formData.ficheNumber || 'En attente'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <ScrollArea className="h-[calc(100vh-350px)]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* General Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Informations du Projet
                  </CardTitle>
                  <CardDescription>Détails du projet et identification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ficheNumber">N° FICHE *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateFicheNumber}
                          className="text-xs"
                        >
                          Générer
                        </Button>
                      </div>
                      <Input
                        id="ficheNumber"
                        value={formData.ficheNumber}
                        onChange={(e) => handleInputChange('ficheNumber', e.target.value)}
                        placeholder="FR-YYYYMMDD-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">PROJET</Label>
                      <Input
                        id="project"
                        value={formData.project}
                        onChange={(e) => handleInputChange('project', e.target.value)}
                        placeholder="Nom du projet"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">ENTREPRISE</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client">MAÎTRE D'ŒUVRE</Label>
                      <Input
                        id="client"
                        value={formData.client}
                        onChange={(e) => handleInputChange('client', e.target.value)}
                        placeholder="Maître d'œuvre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bureauEtude">BUREAU D'ÉTUDE</Label>
                      <Input
                        id="bureauEtude"
                        value={formData.bureauEtude}
                        onChange={(e) => handleInputChange('bureauEtude', e.target.value)}
                        placeholder="Bureau d'étude"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Localisation et Détails</CardTitle>
                  <CardDescription>Emplacement et détails de la réception</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="block">BLOC</Label>
                      <Input
                        id="block"
                        value={formData.block}
                        onChange={(e) => handleInputChange('block', e.target.value)}
                        placeholder="Bloc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">NIVEAU</Label>
                      <Input
                        id="level"
                        value={formData.level}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        placeholder="Niveau"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">LOCALISATION</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Localisation"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Type d'Élément</CardTitle>
                  <CardDescription>Sélectionnez le type d'élément ferraillé</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="elementType">TYPE D'ÉLÉMENT</Label>
                    <select
                      id="elementType"
                      value={formData.elementType}
                      onChange={(e) => handleInputChange('elementType', e.target.value)}
                      className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Sélectionner...</option>
                      {elementTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vérifications de Conformité</CardTitle>
                  <CardDescription>Contrôle des critères d'acceptation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {verifications.map((item, index) => (
                      <div key={index} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <Label className="font-medium text-base">{item.criteria}</Label>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`compliant-${index}`}
                                checked={item.isCompliant}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isCompliant', checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`compliant-${index}`}
                                className="flex items-center gap-1 cursor-pointer text-sm"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Conforme
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Références</CardTitle>
                  <CardDescription>Documents de référence et spécifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="referencePlans">PLANS DE RÉFÉRENCE</Label>
                    <Input
                      id="referencePlans"
                      value={formData.referencePlans}
                      onChange={(e) => handleInputChange('referencePlans', e.target.value)}
                      placeholder="Plans de référence"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'signatures' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Signatures</CardTitle>
                  <CardDescription>Validation par les parties prenantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {signatures.map((sig, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg">{sig.role}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`sig-name-${index}`}>Nom</Label>
                            <Input
                              id={`sig-name-${index}`}
                              value={sig.name}
                              onChange={(e) => handleSignatureChange(index, 'name', e.target.value)}
                              placeholder="Nom complet"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-function-${index}`}>Fonction</Label>
                            <Input
                              id={`sig-function-${index}`}
                              value={sig.function}
                              onChange={(e) => handleSignatureChange(index, 'function', e.target.value)}
                              placeholder="Fonction"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-date-${index}`}>Date</Label>
                            <Input
                              id={`sig-date-${index}`}
                              type="date"
                              value={sig.date}
                              onChange={(e) => handleSignatureChange(index, 'date', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-time-${index}`}>Heure</Label>
                            <Input
                              id={`sig-time-${index}`}
                              type="time"
                              value={sig.time}
                              onChange={(e) => handleSignatureChange(index, 'time', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Fixed Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50">
        <div className="container mx-auto px-4">
          {/* Tabs Navigation */}
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-16 bg-transparent border-0">
              <TabsTrigger 
                value="general"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Général
              </TabsTrigger>
              <TabsTrigger 
                value="verifications"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Vérifications
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="signatures"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Signatures
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <Button
              onClick={() => {
                setFormData({
                  ficheNumber: '',
                  project: '',
                  company: '',
                  client: '',
                  bureauEtude: '',
                  block: '',
                  level: '',
                  location: '',
                  receptionDate: '',
                  receptionTime: '',
                  weather: '',
                  elementType: '',
                  referencePlans: '',
                  borderau: '',
                  specifications: '',
                  planNumber: '',
                  planIndex: '',
                  observations: '',
                  followUpAction: '',
                  reservationDeadline: '',
                  reservationResponsible: ''
                })
                setVerifications(verificationCriteria.map(criteria => ({
                  criteria,
                  isCompliant: false,
                  isNonCompliant: false,
                  isNotApplicable: false,
                  observations: ''
                })))
                setPhotos([])
                setSignatures(signatureRoles.map(role => ({
                  role,
                  name: '',
                  function: '',
                  date: '',
                  time: ''
                })))
              }}
              variant="outline"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              size="lg"
            >
              Soumettre le Formulaire
            </Button>
          </div>
        </div>
      </div>

      {/* View Form Dialog */}
      <Dialog open={!!viewingForm} onOpenChange={(open) => !open && setViewingForm(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détails du Formulaire</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-150px)]">
            {viewingForm && (
              <div className="space-y-6 p-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations du Projet</h3>
                  <p><strong>Projet:</strong> {viewingForm.project}</p>
                  <p><strong>Entreprise:</strong> {viewingForm.company}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
