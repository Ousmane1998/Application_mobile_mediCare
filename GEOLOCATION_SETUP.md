# Configuration de la Géolocalisation - Alerte SOS

## Installation

### 1. Installer expo-location
```bash
cd mobile
expo install expo-location
```

### 2. Permissions Configurées

#### Android
Les permissions suivantes ont été ajoutées dans `app.json`:
- `android.permission.ACCESS_FINE_LOCATION` - Localisation précise (GPS)
- `android.permission.ACCESS_COARSE_LOCATION` - Localisation approximative (réseau)

#### iOS
Les messages de permission ont été configurés dans `app.json`:
- `NSLocationWhenInUseUsageDescription` - Localisation en utilisation
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Localisation toujours

## Fonctionnement

### Flux de Géolocalisation dans `/Patient/emergency-alert.tsx`

1. **Demande de Permission**
   ```typescript
   const { status } = await Location.requestForegroundPermissionsAsync();
   ```
   - Affiche une popup à l'utilisateur
   - L'utilisateur peut accepter ou refuser

2. **Récupération de la Position**
   ```typescript
   const currentLocation = await Location.getCurrentPositionAsync({
     accuracy: Location.Accuracy.High
   });
   ```
   - Récupère les coordonnées GPS en temps réel
   - Utilise la précision haute (GPS)

3. **Reverse Geocoding**
   ```typescript
   const reverseGeocode = await Location.reverseGeocodeAsync({
     latitude,
     longitude
   });
   ```
   - Convertit les coordonnées GPS en adresse lisible
   - Exemple: `14.6937, -17.4441` → `Dakar, Dakar, Senegal`

4. **Fallback en Cas d'Erreur**
   - Si permission refusée → Utilise localisation par défaut (Dakar)
   - Si reverse geocoding échoue → Affiche les coordonnées brutes
   - Si erreur localisation → Utilise localisation par défaut

## Données Envoyées

Quand le patient envoie une alerte SOS, la localisation envoyée contient:

```javascript
{
  lat: 14.6937,           // Latitude
  lng: -17.4441,          // Longitude
  address: "Dakar, Dakar, Senegal"  // Adresse convertie
}
```

## Affichage Côté Médecin

Dans `/Doctor/emergency-detail.tsx`, le médecin voit:

- **Adresse**: Dakar, Dakar, Senegal
- **Coordonnées GPS**: 
  - Lat: 14.6937
  - Lng: -17.4441

## Logs Console

Pour déboguer, vérifiez les logs:

```
📍 Demande de permission de localisation...
✅ Permission de localisation accordée
📍 Position obtenue: 14.6937, -17.4441
📍 Adresse: Dakar, Dakar, Senegal
```

## Limitations Actuelles

- ⚠️ Reverse geocoding ne fonctionne que si une connexion internet est disponible
- ⚠️ La précision GPS dépend du device et de la disponibilité du GPS
- ⚠️ Sur l'émulateur, la localisation peut être simulée

## Améliorations Futures

- [ ] Ajouter un bouton "Actualiser la localisation" sur la page alerte
- [ ] Afficher la localisation sur une carte (Google Maps / Mapbox)
- [ ] Ajouter un historique des localisations
- [ ] Implémenter le suivi en temps réel de la localisation
- [ ] Ajouter un rayon de confiance autour de la position

## Dépannage

### La permission est toujours refusée
- Vérifier les paramètres de l'app sur le device
- Accorder manuellement la permission de localisation

### La localisation est très imprécise
- Vérifier que le GPS est activé
- Essayer en extérieur (le GPS fonctionne mieux dehors)
- Attendre quelques secondes pour que le GPS se calibre

### Reverse geocoding ne fonctionne pas
- Vérifier la connexion internet
- Vérifier que les coordonnées sont valides
- Consulter les logs pour plus de détails
