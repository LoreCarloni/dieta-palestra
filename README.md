# Dieta e Palestra

App web personale per seguire la dieta e l'allenamento: diario dei pasti, acqua e bevande, allenamenti e passi, peso, report e coach.

## Cosa fa

- **Oggi**: lista di cosa manca da inserire (peso, colazione, pranzo, cena, acqua, movimento, chiusura giornata), calorie e macronutrienti rispetto all'obiettivo, bilancio calorico stimato.
- **Pasti**: database di circa 130 alimenti italiani, alimenti personalizzati da etichetta, inserimento rapido per il ristorante, copia del pasto di ieri.
- **Bevande**: acqua con un tocco, bevande zuccherate e alcolici con calorie.
- **Attività**: allenamenti con stima delle calorie (valori MET), passi giornalieri.
- **Report** su 7, 14 o 30 giorni: medie, grafico calorie, andamento del peso, grasso perso stimato rispetto al peso reale, esportazione testuale da incollare in una chat con Claude.
- **Coach**: analisi automatica della settimana, proiezione della data di arrivo all'obiettivo, piano di allenamento settimanale.
- **Promemoria**: file calendario (.ics) con avvisi giornalieri agli orari scelti e link all'app.

I calcoli usano la formula di Mifflin St Jeor; il deficit è di 7700 kcal per kg di grasso. I dati restano nel browser del dispositivo (localStorage): usare l'esportazione del backup dal Profilo.

## Pubblicazione

1. Unire il codice nel branch `main`.
2. Su GitHub: Settings, Pages, Source: **GitHub Actions**.
3. L'app sarà su `https://<utente>.github.io/dieta-palestra/`. Su iPhone: aprire in Safari, Condividi, **Aggiungi alla schermata Home**.

## Sviluppo locale

```
npx http-server -p 8080
```
