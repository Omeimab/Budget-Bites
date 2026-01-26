Budget Bites – Abschlussprojekt Webtechnologie

Projektübersicht

Budget Bites ist eine dynamische Webanwendung, die als Lösung für die monatliche Lebensmittelverwaltung entwickelt wurde. Sie befasst sich mit zwei Hauptproblemen: übermäßigem Konsum und Lebensmittelverschwendung.

Technische Architektur (Orientierungsskript-Referenzen)

1. Webarchitektur 

Die Anwendung nutzt eine Client-Server-Architektur.

Frontend: Responsive SPA (Single Page Application) mit HTML5, CSS3 (Tailwind) und JavaScript.

Backend-as-a-Service: Google Firebase stellt die Datenschicht und Authentifizierungsprotokolle bereit (Abschnitt 3.3).

2. Microservices & APIs

Ich habe die Google Gemini Pro API als RESTful-Webservice integriert. Dadurch kann die Anwendung komplexe Logik (Rezeptgenerierung und intelligente Vorschläge) ohne aufwändige clientseitige Verarbeitung ausführen, was die Leistungsfähigkeit von Microservices demonstriert.

3. Datenmanagement

Alle Anwendungsdaten werden über JSON (JavaScript Object Notation) verarbeitet.

Die persistente Speicherung erfolgt über Firebase Firestore.

Echtzeit-Updates werden mithilfe des Observer-Musters (onSnapshot) implementiert, wodurch sichergestellt wird, dass die Benutzeroberfläche mit der Datenbank synchronisiert bleibt.

4. Dynamische Benutzeroberfläche 

Die Anwendung nutzt DOM-Manipulation, um Inhalte zwischen dem Inventar, der Einkaufsliste und dem Dashboard auszutauschen, ohne die Seite neu zu laden, und sorgt so für eine flüssige Benutzererfahrung.

Funktionen

Intelligente Frischeverfolgung: Benutzer können die geschätzte Haltbarkeit von frischen Produkten (wie Avocados oder Äpfeln) eingeben, und das System berechnet das Verfallsdatum.

Abfall-Dashboard: Verfolgt Artikel, die im Laufe der Zeit aufgrund des Verfalls verloren gegangen sind, um bessere Gewohnheiten zu fördern.

KI-Integration: Generiert Rezepte, die ausschließlich auf den derzeit vorrätigen Zutaten basieren.

Autor
Omeima Bayaa
Eingereicht für: Web Technologie
Dozent: Axel Sierau
