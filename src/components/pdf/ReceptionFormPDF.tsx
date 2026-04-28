import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'

// Register font for Arabic/French support
// Using system fonts for now

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col: {
    flex: 1,
    paddingRight: 10,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1e293b',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  gridItem: {
    width: '48%',
    marginBottom: 8,
    paddingRight: '2%',
  },
  verificationItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  verificationCriteria: {
    flex: 1,
  },
  verificationStatus: {
    width: 80,
    textAlign: 'right',
  },
  statusBadge: {
    padding: 2,
    borderRadius: 3,
    fontSize: 8,
    textAlign: 'center',
  },
  statusCompliant: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusNonCompliant: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusNA: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  signatureSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  signatureItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  signatureRole: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  signatureInfo: {
    fontSize: 8,
    color: '#64748b',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  photoItem: {
    width: '48%',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  textCenter: {
    textAlign: 'center',
  },
})

interface ReceptionFormPDFProps {
  data: any
}

export default function ReceptionFormPDF({ data }: ReceptionFormPDFProps) {
  const elementTypes: Record<string, string> = {
    semelle_isolee: 'Semelle isolée',
    semelle_filante: 'Semelle filante',
    poteau: 'Poteau',
    poutre: 'Poutre',
    muret: 'Muret',
    dalle_pleine: 'Dalle pleine',
    voile: 'Voile',
    escalier: 'Escalier',
    autre: 'Autre',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FICHIER DE RÉCEPTION FERRAILLAGES</Text>
          <Text style={styles.subtitle}>Contrôle Qualité</Text>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.boldText}>N°: {data.ficheNumber || 'N/A'}</Text>
            <Text style={styles.boldText}>Statut: {data.status || 'N/A'}</Text>
          </View>
        </View>

        {/* Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS DU PROJET</Text>
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>PROJET</Text>
              <Text style={styles.value}>{data.project || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>ENTREPRISE</Text>
              <Text style={styles.value}>{data.company || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>MAÎTRE D'ŒUVRE</Text>
              <Text style={styles.value}>{data.client || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>BUREAU D'ÉTUDE</Text>
              <Text style={styles.value}>{data.bureauEtude || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>TYPE D'ÉLÉMENT</Text>
              <Text style={styles.value}>{data.elementType ? elementTypes[data.elementType] || data.elementType : '-'}</Text>
            </View>
          </View>
        </View>

        {/* Location and Reception Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCALISATION & RÉCEPTION</Text>
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>BLOC / ZONE</Text>
              <Text style={styles.value}>{data.block || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>NIVEAU / ÉTAGE</Text>
              <Text style={styles.value}>{data.level || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>LOCALISATION (AXES)</Text>
              <Text style={styles.value}>{data.location || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>DATE DE RÉCEPTION</Text>
              <Text style={styles.value}>{data.receptionDate || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>HEURE</Text>
              <Text style={styles.value}>{data.receptionTime || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>CONDITIONS MÉTÉO</Text>
              <Text style={styles.value}>{data.weather || '-'}</Text>
            </View>
            {data.otherInfo && (
              <View style={styles.gridItem}>
                <Text style={styles.label}>AUTRE</Text>
                <Text style={styles.value}>{data.otherInfo}</Text>
              </View>
            )}
          </View>
        </View>

        {/* References */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RÉFÉRENCES</Text>
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>PLANS DE RÉFÉRENCE</Text>
              <Text style={styles.value}>{data.referencePlans || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>BORDEREAU DE FERRAILLAGE</Text>
              <Text style={styles.value}>{data.borderau || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>N° PLAN</Text>
              <Text style={styles.value}>{data.planNumber || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>INDICE</Text>
              <Text style={styles.value}>{data.planIndex || '-'}</Text>
            </View>
          </View>
          {data.specifications && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>SPÉCIFICATIONS APPLICABLES</Text>
              <Text style={styles.value}>{data.specifications}</Text>
            </View>
          )}
        </View>

        {/* Verifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VÉRIFICATIONS</Text>
          {data.verifications && data.verifications.length > 0 ? (
            data.verifications.map((v: any, index: number) => (
              <View key={index} style={styles.verificationItem}>
                <View style={styles.verificationCriteria}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{v.criteria}</Text>
                  {v.observations && (
                    <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                      Obs: {v.observations}
                    </Text>
                  )}
                </View>
                <View style={styles.verificationStatus}>
                  <Text
                    style={[
                      styles.statusBadge,
                      v.isCompliant ? styles.statusCompliant :
                      v.isNonCompliant ? styles.statusNonCompliant :
                      styles.statusNA,
                    ]}
                  >
                    {v.isCompliant ? 'CONFORME' :
                     v.isNonCompliant ? 'NON CONF.' :
                     'N/A'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.value}>Aucune vérification</Text>
          )}
        </View>

        {/* Photos */}
        {data.photos && data.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PHOTOS</Text>
            <View style={styles.photoGrid}>
              {data.photos.map((photo: any, index: number) => (
                <View key={index} style={styles.photoItem}>
                  {photo.path && (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image
                      src={photo.path.startsWith('data:') ? photo.path : `http://localhost:3000${photo.path}`}
                      style={styles.photo}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Observations and Follow-up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBSERVATIONS & SUITES À DONNER</Text>
          {data.observations && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Observations / Réserves</Text>
              <Text style={styles.value}>{data.observations}</Text>
            </View>
          )}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Suites à Donner</Text>
            <Text style={[styles.value, styles.boldText]}>
              {data.followUpAction || '-'}
            </Text>
          </View>
          {(data.reservationDeadline || data.reservationResponsible) && (
            <View style={styles.grid2}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Délai de levée des réserves</Text>
                <Text style={styles.value}>{data.reservationDeadline || '-'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Responsable</Text>
                <Text style={styles.value}>{data.reservationResponsible || '-'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>
          {data.signatures && data.signatures.length > 0 ? (
            <View style={styles.grid2}>
              {data.signatures.map((sig: any, index: number) => (
                <View key={index} style={styles.signatureItem}>
                  <Text style={styles.signatureRole}>{sig.role}</Text>
                  <Text style={styles.signatureInfo}>
                    Nom: {sig.name || '-'}
                  </Text>
                  <Text style={styles.signatureInfo}>
                    Fonction: {sig.function || '-'}
                  </Text>
                  <Text style={styles.signatureInfo}>
                    {sig.date || '-'} {sig.time || ''}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.value}>Aucune signature</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré automatiquement - {new Date().toLocaleDateString('fr-FR')}
        </Text>
      </Page>
    </Document>
  )
}
