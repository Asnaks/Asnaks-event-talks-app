import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Fetch the XML content
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            updated = entry.find('atom:updated', ns)
            link = entry.find('atom:link', ns)
            content = entry.find('atom:content', ns)
            
            link_href = link.attrib.get('href') if link is not None else ""
            content_html = content.text if content is not None else ""
            
            entries.append({
                'title': title.text if title is not None else "Unknown Date",
                'updated': updated.text if updated is not None else "",
                'link': link_href,
                'content': content_html
            })
            
        return entries, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'releases': entries})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
