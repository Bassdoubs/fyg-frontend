# Intégration des Feedbacks Discord dans l'Interface Web Find Your Gate

Ce document détaille le plan d'implémentation pour intégrer les feedbacks utilisateurs reçus via le bot Discord dans l'interface web de Find Your Gate, facilitant ainsi l'ajout de parkings manquants.

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Modifications côté Bot Discord](#modifications-côté-bot-discord)
3. [Développement côté Interface Web](#développement-côté-interface-web)
4. [Architecture d'intégration](#architecture-dintégration)
5. [Étapes d'implémentation](#étapes-dimplémentation)
6. [Considérations techniques](#considérations-techniques)

## Vue d'ensemble

### Situation actuelle
- Le bot Discord permet aux utilisateurs de signaler des parkings manquants
- Les utilisateurs peuvent indiquer s'ils ont des informations à partager
- Les notifications sont envoyées dans un salon Discord pour les administrateurs
- Aucune intégration avec l'interface web de gestion

### Objectif
Créer une intégration fluide entre le bot Discord et l'interface web pour:
- Visualiser les parkings manquants signalés
- Faciliter l'ajout de nouveaux parkings
- Améliorer le suivi des demandes
- Maintenir les utilisateurs informés du traitement de leurs signalements

## Modifications côté Bot Discord

### 1. Stockage structuré des feedbacks

```javascript
// Structure de données pour les feedbacks
const parkingFeedback = {
  id: "unique_id",                      // ID unique du feedback
  parkingName: "Nom du parking",        // Nom du parking recherché
  timestamp: "2025-04-11T12:30:00Z",    // Date et heure du feedback
  userId: "discord_user_id",            // ID Discord de l'utilisateur
  username: "discord_username",         // Nom d'utilisateur Discord
  hasInformation: true/false,           // Si l'utilisateur a des informations
  messageId: "discord_message_id",      // ID du message original
  channelId: "discord_channel_id",      // ID du canal Discord
  status: "NEW",                        // Statut (NEW, PENDING, IN_PROGRESS, COMPLETED)
  notes: "Notes additionnelles",        // Informations supplémentaires
  location: {                           // Information de localisation (si disponible)
    latitude: 0,
    longitude: 0
  }
}
```

### 2. Endpoint API pour le bot Discord

Créer un service d'API REST pour que le bot puisse envoyer les données:

```javascript
// Exemple de code pour le bot Discord (Node.js)
async function sendFeedbackToAPI(feedback) {
  try {
    const response = await fetch('https://findyourgate.com/api/discord-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(feedback)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending feedback to API:', error);
  }
}
```

### 3. Amélioration des interactions du bot

- Ajouter un bouton "Fournir plus d'informations" pour les utilisateurs qui ont sélectionné "J'ai des informations"
- Créer un formulaire Discord (modal) pour collecter des informations structurées
- Implémenter des réponses automatiques informant l'utilisateur du statut de traitement

## Développement côté Interface Web

### 1. Tableau de bord "Parkings manquants"

Créer une nouvelle section dans l'interface d'administration:

```jsx
// Exemple de composant React pour le tableau de parkings manquants
function MissingParkingsDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  
  useEffect(() => {
    // Charger les feedbacks depuis l'API
    async function loadFeedbacks() {
      const data = await FeedbackService.getAll();
      setFeedbacks(data);
    }
    
    loadFeedbacks();
    
    // Établir une connexion websocket pour les mises à jour en temps réel
    const socket = new WebSocket('wss://findyourgate.com/ws/feedback');
    socket.onmessage = (event) => {
      const newFeedback = JSON.parse(event.data);
      setFeedbacks(prev => [...prev, newFeedback]);
    };
    
    return () => socket.close();
  }, []);
  
  return (
    <div className="dashboard-container">
      <h1>Parkings manquants signalés</h1>
      
      <div className="stats-summary">
        <StatCard title="Nouveaux signalements" value={feedbacks.filter(f => f.status === 'NEW').length} />
        <StatCard title="En cours de traitement" value={feedbacks.filter(f => f.status === 'IN_PROGRESS').length} />
        <StatCard title="Complétés" value={feedbacks.filter(f => f.status === 'COMPLETED').length} />
      </div>
      
      <FeedbacksTable feedbacks={feedbacks} />
    </div>
  );
}
```

### 2. Vue détaillée d'un parking signalé

Créer une interface détaillée pour chaque signalement:

```jsx
function ParkingFeedbackDetail({ feedbackId }) {
  const [feedback, setFeedback] = useState(null);
  const [relatedFeedbacks, setRelatedFeedbacks] = useState([]);
  const [status, setStatus] = useState('');
  
  // Charger les données du feedback et les feedbacks associés au même parking
  
  return (
    <div className="feedback-detail">
      <header className="feedback-header">
        <h1>{feedback?.parkingName}</h1>
        <StatusBadge status={feedback?.status} />
      </header>
      
      <div className="feedback-content">
        <div className="feedback-metrics">
          <MetricCard 
            title="Total demandes" 
            value={relatedFeedbacks.length} 
            icon={<UsersIcon />} 
          />
          <MetricCard 
            title="Utilisateurs avec info" 
            value={relatedFeedbacks.filter(f => f.hasInformation).length} 
            icon={<InfoIcon />} 
          />
          <MetricCard 
            title="Premier signalement" 
            value={formatDate(relatedFeedbacks[0]?.timestamp)} 
            icon={<CalendarIcon />} 
          />
        </div>
        
        {feedback?.location && (
          <div className="location-map">
            <h3>Emplacement approximatif</h3>
            <MapComponent location={feedback.location} />
          </div>
        )}
        
        <div className="feedback-actions">
          <AddParkingForm initialData={generateInitialData(feedback)} />
          <DiscordReplyForm feedbackId={feedbackId} />
        </div>
        
        <div className="related-feedbacks">
          <h3>Tous les signalements pour ce parking</h3>
          <FeedbackTimelineList feedbacks={relatedFeedbacks} />
        </div>
      </div>
    </div>
  );
}
```

### 3. Formulaire d'ajout rapide

Créer un formulaire optimisé pour l'ajout rapide de parkings:

```jsx
function QuickAddParkingForm({ feedbackData, onSuccess }) {
  const [formData, setFormData] = useState({
    name: feedbackData.parkingName || '',
    address: '',
    capacity: '',
    coordinates: feedbackData.location || { latitude: '', longitude: '' },
    openingHours: '',
    pricing: '',
    contactInfo: '',
    facilities: []
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ajouter le parking
      const newParking = await ParkingService.create(formData);
      
      // Mettre à jour le statut des feedbacks associés
      await FeedbackService.updateStatusByParkingName(
        formData.name, 
        'COMPLETED', 
        `Parking ajouté avec ID: ${newParking.id}`
      );
      
      // Notifier l'utilisateur Discord
      await DiscordService.notifyUserOnCompletion(feedbackData.userId, newParking);
      
      onSuccess(newParking);
    } catch (error) {
      console.error('Error adding parking:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="quick-add-form">
      {/* Champs du formulaire */}
    </form>
  );
}
```

### 4. Composants UI pour les notifications et statistiques

Créer des composants visuels pour afficher les informations:

```jsx
// Badge de notification dans le header
function FeedbackNotificationBadge() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    async function getNewFeedbacksCount() {
      const data = await FeedbackService.getNewCount();
      setCount(data.count);
    }
    
    getNewFeedbacksCount();
    
    // WebSocket pour les mises à jour en temps réel
    const socket = new WebSocket('wss://findyourgate.com/ws/feedback-count');
    socket.onmessage = (event) => {
      setCount(JSON.parse(event.data).count);
    };
    
    return () => socket.close();
  }, []);
  
  if (count === 0) return null;
  
  return (
    <div className="notification-badge">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="badge-content"
      >
        {count}
      </motion.div>
    </div>
  );
}
```

## Architecture d'intégration

### 1. Schéma d'architecture

```
┌──────────────┐                         ┌────────────────┐
│              │                         │                │
│  Bot Discord │ ───── Webhook / ────►   │  API Backend   │
│              │        API REST         │                │
└──────────────┘                         └────────────────┘
                                                │
                                                │
                                                ▼
┌──────────────┐                         ┌────────────────┐
│              │                         │                │
│ Interface Web│ ◄───── REST API ─────   │ Base de données│
│              │                         │                │
└──────────────┘                         └────────────────┘
       │                                         ▲
       │                                         │
       └─────────── WebSocket ──────────────────┘
        (Notifications en temps réel)
```

### 2. Modèle de données

Ajouter un nouveau modèle dans MongoDB:

```javascript
// Modèle MongoDB pour les feedbacks Discord
const DiscordFeedbackSchema = new Schema({
  parkingName: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: String,
  username: String,
  hasInformation: Boolean,
  messageId: String,
  channelId: String,
  status: {
    type: String,
    enum: ['NEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'NEW'
  },
  notes: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  adminNotes: String,
  completedAt: Date,
  assignedTo: String
});

// Index pour accélérer les recherches par nom de parking
DiscordFeedbackSchema.index({ parkingName: 'text' });
```

### 3. API Backend

Créer des endpoints REST pour:

1. **Création de feedback**
   ```
   POST /api/discord-feedback
   ```

2. **Récupération des feedbacks**
   ```
   GET /api/discord-feedback
   GET /api/discord-feedback/:id
   GET /api/discord-feedback/by-parking-name/:name
   GET /api/discord-feedback/stats
   ```

3. **Mise à jour de statut**
   ```
   PATCH /api/discord-feedback/:id/status
   PATCH /api/discord-feedback/by-parking-name/:name/status
   ```

4. **Notifications Discord**
   ```
   POST /api/discord-feedback/:id/reply
   ```

5. **WebSocket pour les mises à jour en temps réel**
   ```
   WSS /ws/feedback
   WSS /ws/feedback-count
   ```

## Étapes d'implémentation

### Phase 1: Préparation et infrastructure
1. **Semaine 1**: Conception du schéma de données et de l'architecture
   - Créer le modèle de données dans MongoDB
   - Définir les endpoints API
   - Planifier l'architecture WebSocket

2. **Semaine 2**: Développement du service API
   - Implémenter les endpoints REST
   - Configurer l'authentification et la sécurité
   - Mettre en place la structure WebSocket

### Phase 2: Intégration Discord
3. **Semaine 3**: Modifications du bot Discord
   - Mettre à jour le format de données des feedbacks
   - Implémenter l'API client pour envoyer les données
   - Ajouter les formulaires avancés pour la collecte d'informations

4. **Semaine 4**: Tests d'intégration bot-API
   - Tester les flux de données
   - Vérifier la persistance dans la base de données
   - Résoudre les problèmes d'intégration

### Phase 3: Interface Web
5. **Semaine 5-6**: Développement du tableau de bord
   - Créer le tableau de bord des parkings manquants
   - Implémenter les statistiques et visualisations
   - Développer la vue détaillée des feedbacks

6. **Semaine 7**: Formulaire d'ajout rapide et interactions
   - Créer le formulaire d'ajout rapide
   - Implémenter la communication avec Discord
   - Développer le système de notifications

7. **Semaine 8**: Tests utilisateurs et optimisations
   - Tester l'ensemble du flux avec des utilisateurs réels
   - Optimiser l'UX basé sur les retours
   - Ajuster les performances

## Considérations techniques

### Sécurité
- Authentification API avec clés sécurisées
- Validation des données Discord pour éviter les usurpations d'identité
- Rate limiting pour prévenir les abus
- Sanitization des entrées utilisateur

### Performance
- Index MongoDB pour optimiser les requêtes fréquentes
- Pagination des résultats pour les grandes quantités de données
- Mise en cache des statistiques et données fréquemment accédées

### Évolutivité
- Architecture modulaire pour faciliter les extensions futures
- WebSockets séparés pour différents types de notifications
- Possibilité d'ajouter d'autres sources de feedbacks (Twitter, email, etc.)

### UX / Design
- Animations subtiles pour indiquer les mises à jour en temps réel
- Code couleur cohérent pour les différents statuts
- Feedback visuel immédiat lors des actions administrateur
- Thème cohérent avec le reste de l'application

---

Document généré le : 11/04/2025 